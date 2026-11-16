/**
 * Bounded ZIP reader for `.algopack` (Stage 4).
 *
 * Why not just `unzipSync`: it inflates everything into memory before we can
 * apply any limit, so a 200 KB zip bomb would already have allocated gigabytes.
 * This reader:
 *
 *  1. parses the central directory itself (no allocation beyond metadata);
 *  2. runs the pure entry policy (`checkArchiveEntries`) *before* touching data;
 *  3. inflates each entry in 1 KiB input slices with a hard output cap, so even
 *     a decompression bomb stops at `PACK_LIMITS.fileBytes`;
 *  4. verifies the produced length against the declared length (a lie is an
 *     error, not a warning);
 *  5. decodes strict UTF-8 and only ever returns text.
 *
 * It never writes to the host file system: the result is an in-memory map.
 */
import { Inflate } from 'fflate';
import { checkArchiveEntries, type ZipEntryMeta } from '../../domain/packs/archive';
import { fail, failWith, packError, type PackError, type PackResult } from '../../domain/packs/errors';
import { PACK_LIMITS } from '../../domain/packs/types';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const SLICE_BYTES = 1024;

export interface ExtractedArchive {
  /** Path → UTF-8 text, already policy-compliant. */
  files: Map<string, string>;
  /** Decompressed bytes actually materialised. */
  bytes: number;
  entries: ZipEntryMeta[];
}

/** Locate the End Of Central Directory record (at the very end, possibly with a comment). */
function findEocd(view: DataView, length: number): number {
  const min = Math.max(0, length - 0xffff - 22);
  for (let offset = length - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

interface CentralEntry extends ZipEntryMeta {
  localOffset: number;
  flags: number;
}

function readCentralDirectory(view: DataView, bytes: Uint8Array, length: number): PackResult<CentralEntry[]> {
  const eocd = findEocd(view, length);
  if (eocd < 0) return fail('not-a-zip');

  const diskNumber = view.getUint16(eocd + 4, true);
  const cdStartDisk = view.getUint16(eocd + 6, true);
  const entriesOnDisk = view.getUint16(eocd + 8, true);
  const totalEntries = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);

  if (diskNumber !== 0 || cdStartDisk !== 0 || entriesOnDisk !== totalEntries) return fail('not-a-zip');
  if (totalEntries === 0) return fail('empty-archive');
  if (totalEntries > PACK_LIMITS.entries) {
    return fail('too-many-entries', { limit: String(PACK_LIMITS.entries), count: String(totalEntries) });
  }
  if (cdOffset + cdSize > length) return fail('not-a-zip');

  const entries: CentralEntry[] = [];
  let offset = cdOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > length || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) return fail('not-a-zip');
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);

    // ZIP64 markers: we deliberately do not support >4 GiB entries or archives.
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      return fail('unsupported-method', { path: '(zip64)' });
    }

    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > length) return fail('not-a-zip');
    let name: string;
    try {
      name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(nameStart, nameEnd));
    } catch {
      return fail('unsafe-path', { path: '(non-utf8 name)' });
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      method,
      encrypted: (flags & 0x1) !== 0,
      flags,
      localOffset,
    });
    offset = nameEnd + extraLength + commentLength;
  }
  return { ok: true, value: entries };
}

/** Starting offset of an entry's payload inside the archive. */
function localDataOffset(view: DataView, entry: CentralEntry): number | null {
  const start = entry.localOffset;
  if (start + 30 > view.byteLength) return null;
  if (view.getUint32(start, true) !== LOCAL_SIGNATURE) return null;
  const nameLength = view.getUint16(start + 26, true);
  const extraLength = view.getUint16(start + 28, true);
  const dataStart = start + 30 + nameLength + extraLength;
  if (dataStart + entry.compressedSize > view.byteLength) return null;
  return dataStart;
}

function decodeUtf8(chunks: Uint8Array[], path: string): string | PackError {
  const merged = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(merged);
  } catch {
    return packError('not-text', { path });
  }
}

function isPackError(value: string | PackError): value is PackError {
  return typeof value !== 'string';
}

/** Inflate one entry with a hard output cap (never trusts the declared size). */
function extractEntry(bytes: Uint8Array, view: DataView, entry: CentralEntry): string | PackError {
  const dataStart = localDataOffset(view, entry);
  if (dataStart == null) return packError('not-a-zip');

  const cap = Math.min(entry.uncompressedSize, PACK_LIMITS.fileBytes);
  const payload = bytes.subarray(dataStart, dataStart + entry.compressedSize);
  const chunks: Uint8Array[] = [];
  let produced = 0;
  let overflow = false;

  if (entry.method === 0) {
    if (payload.length > cap) return packError('file-too-large', { path: entry.name, limit: String(cap) });
    chunks.push(payload);
    produced = payload.length;
  } else {
    try {
      const inflate = new Inflate((chunk) => {
        if (!chunk.length) return;
        produced += chunk.length;
        if (produced > cap) {
          overflow = true;
          return;
        }
        chunks.push(chunk);
      });
      for (let index = 0; index < payload.length; index += SLICE_BYTES) {
        if (overflow) break;
        const end = Math.min(index + SLICE_BYTES, payload.length);
        inflate.push(payload.subarray(index, end), end >= payload.length);
      }
    } catch {
      return packError('not-a-zip');
    }
  }

  if (overflow) return packError('file-too-large', { path: entry.name, limit: String(cap) });
  if (produced !== entry.uncompressedSize) {
    return packError('size-mismatch', { path: entry.name });
  }
  return decodeUtf8(chunks, entry.name);
}

/**
 * Read and validate an `.algopack` archive.
 *
 * The `archiveBytes` limit is checked by the caller (file picker) *and* here, so
 * a direct API call cannot bypass it.
 */
export function readPackArchive(bytes: Uint8Array): PackResult<ExtractedArchive> {
  if (bytes.length === 0) return fail('not-a-zip');
  if (bytes.length > PACK_LIMITS.archiveBytes) {
    return fail('file-too-large', { path: '.algopack', limit: String(PACK_LIMITS.archiveBytes) });
  }
  if (bytes.length < 22) return fail('not-a-zip');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const central = readCentralDirectory(view, bytes, bytes.length);
  if (!central.ok) return central;

  const policy = checkArchiveEntries(central.value);
  if (!policy.ok) return policy;

  const files = new Map<string, string>();
  const errors: PackError[] = [];
  let total = 0;

  for (const entry of central.value) {
    let text: string | PackError;
    try {
      text = extractEntry(bytes, view, entry);
    } catch {
      errors.push(packError('not-a-zip'));
      continue;
    }
    if (isPackError(text)) {
      errors.push(text);
      continue;
    }
    if (files.has(entry.name)) {
      errors.push(packError('duplicate-path', { path: entry.name }));
      continue;
    }
    total += new TextEncoder().encode(text).length;
    if (total > PACK_LIMITS.totalBytes) {
      errors.push(packError('total-too-large', { limit: String(PACK_LIMITS.totalBytes) }));
      break;
    }
    files.set(entry.name, text);
  }

  if (errors.length) return failWith(errors);
  return { ok: true, value: { files, bytes: total, entries: central.value } };
}
