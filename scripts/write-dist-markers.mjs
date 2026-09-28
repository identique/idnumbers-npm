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
// Issue #122: bundlers read `sideEffects` from the *nearest* package.json, which
// for every compiled file is this marker, not the root one. So each marker also
// declares the only modules with import-time side effects: the batteries-included
// root entry and the registration it imports. Everything else (idnumbers/core and
// the idnumbers/countries/<iso3> subpaths) is pure, so bundlers can drop imported
// modules whose exports go unused, such as unused enums and secondary ID types.
// (Unused countries stay out regardless: idnumbers/core never imports them.)
// Keep this list in sync with `sideEffects` in the root package.json.
//
// Run after both builds complete (wired into the "build" script).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));

/** Modules (relative to each dist folder) that run code on import. */
const SIDE_EFFECTS = ['./index.js', './registry/registerAll.js'];

/** Writes `{ "type", "sideEffects" }` to `<dir>/package.json`, failing loudly if `dir` is missing. */
function writeMarker(dirName, type) {
  const dir = join(DIST_DIR, dirName);
  if (!existsSync(dir)) {
    console.error(`error: ${dir} does not exist -- run the tsc builds before this script`);
    process.exit(1);
  }
  const marker = { type, sideEffects: SIDE_EFFECTS };
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(marker, null, 2)}\n`);
  console.log(`wrote ${dirName}/package.json ({ "type": "${type}" })`);
}

writeMarker('cjs', 'commonjs');
writeMarker('esm', 'module');
