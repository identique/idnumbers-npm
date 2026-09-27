#!/usr/bin/env node
// Issue #120: dual ESM/CJS output.
//
// The two `tsc` invocations (tsconfig.build.cjs.json / tsconfig.build.esm.json)
// emit plain `.js` files into dist/cjs and dist/esm with no module-type marker
// of their own, so Node would otherwise fall back to whatever `"type"` the
// nearest package.json declares. The root package.json intentionally has no
// `"type"` field, because the ESM-syntax docs/examples/*.js files rely on
// Node's extension-based syntax detection to run as plain `node file.js`.
// Dropping a minimal package.json into each dist subfolder scopes the module
// type to just that folder, which is the standard dual-package pattern.
//
// Run after both builds complete (wired into the "build" script).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = new URL('../dist/', import.meta.url).pathname;

/** Writes `{ "type": <type> }` to `<dir>/package.json`, failing loudly if `dir` is missing. */
function writeMarker(dirName, type) {
  const dir = join(DIST_DIR, dirName);
  if (!existsSync(dir)) {
    console.error(`error: ${dir} does not exist -- run the tsc builds before this script`);
    process.exit(1);
  }
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`);
  console.log(`wrote ${dirName}/package.json ({ "type": "${type}" })`);
}

writeMarker('cjs', 'commonjs');
writeMarker('esm', 'module');
