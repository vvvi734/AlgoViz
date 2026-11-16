// Validate an `.algopack` exactly the way the browser does at import time.
//
// Usage: npm run pack -- packs/algolens-search-basics.algopack
// Exit code 1 when anything fails, with the same structured codes the UI shows.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { algorithmIds } from '../src/domain/algorithms/examples';
import { builtinCourseAlgorithms } from '../src/domain/lessons/catalog';
import { describeErrors } from '../src/domain/packs/errors';
import { validatePack } from '../src/domain/packs/validate';
import { TRACE_SCHEMA_VERSION } from '../src/domain/trace/schema';
import { readPackArchive } from '../src/runtime/packs/zip';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const target = args[0];

if (!target) {
  console.error('usage: npm run pack -- path/to/pack.algopack');
  process.exit(2);
}

let bytes: Uint8Array;
try {
  bytes = new Uint8Array(readFileSync(resolve(target)));
} catch (error) {
  console.error(`cannot read ${target}: ${(error as Error).message}`);
  process.exit(2);
}

const archive = readPackArchive(bytes);
if (!archive.ok) {
  console.error(`FAILED ${target}`);
  console.error(`  ${describeErrors(archive.errors)}`);
  process.exit(1);
}

const validation = validatePack({
  files: archive.value.files,
  bytes: archive.value.bytes,
  traceSchemaVersion: TRACE_SCHEMA_VERSION,
  catalogIds: algorithmIds(),
  builtinAlgorithmIds: builtinCourseAlgorithms(),
  // The CLI validates a single archive, out of any install context.
  installed: [],
});
if (!validation.ok) {
  console.error(`FAILED ${target}`);
  console.error(`  ${describeErrors(validation.errors)}`);
  process.exit(1);
}

const preview = validation.value;
console.log(`OK ${target}`);
console.log(`  pack: ${preview.manifest.packId} v${preview.manifest.version} (${preview.manifest.license})`);
console.log(`  name: ${preview.manifest.name.zh} / ${preview.manifest.name.en}`);
console.log(
  `  files: ${preview.totals.files}, bytes: ${preview.totals.bytes}, lessons: ${preview.totals.lessonCount}, python examples: ${preview.totals.pythonExamples}`,
);
for (const lesson of preview.lessons) {
  console.log(`  lesson ${lesson.lessonId} → ${lesson.algorithmId} (${lesson.steps.length} steps)`);
}
for (const example of preview.examples) {
  console.log(`  example ${example.path} → ${example.lessonId}`);
}
