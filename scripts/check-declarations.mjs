#!/usr/bin/env node
/**
 * Issue #123: the published type declarations must not use `any`.
 *
 * Parses every `.d.ts` file under dist/cjs and dist/esm and fails on each `any`
 * type. Checking the emitted declarations, not the sources, also catches an
 * `any` the compiler inferred into a declaration, which ESLint's
 * `no-explicit-any` cannot see. Comments and string literals are ignored.
 *
 * Usage: npm run build && node scripts/check-declarations.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST_DIRS = ['dist/cjs', 'dist/esm'];

function* declarationFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* declarationFiles(path);
    else if (entry.name.endsWith('.d.ts')) yield path;
  }
}

/** 1-based `line:column` of every `any` type in a declaration file. */
function findAny(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
  const hits = [];
  const visit = node => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
      hits.push(`${line + 1}:${character + 1}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

let files = 0;
const problems = [];
for (const dir of DIST_DIRS) {
  const root = join(REPO_ROOT, dir);
  if (!existsSync(root)) {
    console.error(`[declarations] ${dir} is missing -- run "npm run build" first`);
    process.exit(1);
  }
  for (const file of declarationFiles(root)) {
    files += 1;
    for (const position of findAny(file)) {
      problems.push(`${relative(REPO_ROOT, file)}:${position}`);
    }
  }
}

if (files === 0) {
  console.error('[declarations] no .d.ts files found -- run "npm run build" first');
  process.exit(1);
}
if (problems.length > 0) {
  for (const problem of problems) console.error(`[declarations] \`any\` at ${problem}`);
  console.error(`[declarations] ${problems.length} \`any\` type(s) in the published declarations`);
  process.exit(1);
}
console.log(`[declarations] ${files} declaration files, no \`any\``);
