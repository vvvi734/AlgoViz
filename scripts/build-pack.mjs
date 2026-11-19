// Build an official `.algopack` from its source directory.
//
// Usage: node scripts/build-pack.mjs [sourceDir] [outFile]
// Default: packs/src/algolens-fib-basics → packs/algolens-fib-basics.algopack
//
// This only packs bytes; content rules are enforced by
// `npm run pack -- <file>` (scripts/validate-pack.ts), which reuses the same
// domain validators the browser uses at import time.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

const root = process.cwd();
const sourceDir = process.argv[2] ?? join('packs', 'src', 'algolens-fib-basics');
const outFile = process.argv[3] ?? join('packs', `${sourceDir.split(/[\\/]/).pop()}.algopack`);

function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const entries = {};
for (const full of walk(join(root, sourceDir))) {
  // ZIP paths always use forward slashes, exactly as the reader expects.
  const name = relative(join(root, sourceDir), full).split(sep).join('/');
  entries[name] = strToU8(readFileSync(full, 'utf8'));
}

const zipped = zipSync(entries, { level: 9 });
writeFileSync(join(root, outFile), zipped);
const size = Buffer.byteLength(readFileSync(join(root, outFile)));
console.log(`wrote ${outFile} (${Object.keys(entries).length} files, ${size} bytes)`);
for (const name of Object.keys(entries).sort()) console.log(`  ${name} (${entries[name].length} B)`);
