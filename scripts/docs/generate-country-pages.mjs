#!/usr/bin/env node
// Issue #136: generate the per-country pages of the TypeDoc API site.
//
// Every page comes from the registry metadata of the built library (the same data
// `listSupportedCountries()`, `getCountryIdFormat()` and `getInputMask()` return), so
// the pages cannot drift from what the validators accept, and a new country gets a
// page without anyone writing one.
//
// Output, all under build/docs/ (git-ignored, cleaned on every run so a removed
// country leaves nothing behind):
//   countries.md              the overview: one table of every country, plus the
//                             front matter that nests the country pages under it
//   countries/<iso3>.md       one page per registered country
//
// typedoc.json lists build/docs/countries.md in `projectDocuments`.
//
// Usage: npm run build && node scripts/docs/generate-country-pages.mjs
//        (or `npm run docs`, which then runs typedoc)
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BUILT_ENTRY = join(REPO_ROOT, 'dist', 'cjs', 'index.js');
const OUT_DIR = join(REPO_ROOT, 'build', 'docs');
const PAGES_DIR = join(OUT_DIR, 'countries');

if (!existsSync(BUILT_ENTRY)) {
  console.error(`generate-country-pages: ${BUILT_ENTRY} is missing; run \`npm run build\` first.`);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { listSupportedCountries, getCountryIdFormat, getInputMask, registry } = require(BUILT_ENTRY);

/** Backslash-escape the characters Markdown (and TypeDoc's HTML output) would act on. */
const text = value => String(value).replace(/[\\`*_{}[\]<>|#~]/g, '\\$&');

/** Inline code; the fence is longer than any backtick run inside the value. */
const code = value => {
  const longest = Math.max(0, ...(String(value).match(/`+/g) ?? []).map(run => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${value}${fence}`;
};

const yesNo = flag => (flag ? 'yes' : 'no');
const slug = countryCode => countryCode.toLowerCase();

/** The alias keys (alpha-2 and legacy codes) that resolve to `countryCode`. */
const aliasesOf = countryCode =>
  registry
    .listAll()
    .filter(key => key !== countryCode && registry.resolveKey(key) === countryCode)
    .sort();

const lengthText = ({ min, max }) => (min === max ? String(min) : `${min} to ${max}`);

function countryPage(info) {
  const format = getCountryIdFormat(info.code);
  const mask = getInputMask(info.code);
  const aliases = aliasesOf(info.code);
  const { metadata } = format;
  const slot = slug(info.code);

  const rows = [
    ['Country code', [code(info.code), ...aliases.map(code)].join(', ')],
    ['ID type', text(format.idType)],
    ...(format.officialName ? [['Official name', text(format.officialName)]] : []),
    ...(metadata.names.length > 0 ? [['Also known as', metadata.names.map(text).join('; ')]] : []),
    ...(format.format ? [['Display format', code(format.format)]] : []),
    ...(mask ? [['Input masks', mask.masks.map(code).join(', ')]] : []),
    ['Length', lengthText(format.length)],
    ...(format.example ? [['Example', code(format.example)]] : []),
    ['Checksum', format.hasChecksum ? 'yes' : 'no'],
    ...(format.checksumAlgorithm ? [['Checksum algorithm', text(format.checksumAlgorithm)]] : []),
    ['Parsable', yesNo(format.isParsable)],
    ...(metadata.deprecated ? [['Deprecated', 'yes']] : []),
  ];

  const lines = [
    '---',
    `title: ${JSON.stringify(`${info.name} (${info.code})`)}`,
    '---',
    '',
    `The ${text(format.idType)} of ${text(info.name)}. This page is generated from the ` +
      'registry metadata of the library.',
    '',
    '| Property | Value |',
    '| --- | --- |',
    ...rows.map(([property, value]) => `| ${property} | ${value} |`),
    '',
    '## Usage',
    '',
    'The root entry registers every country:',
    '',
    '```ts',
    "import { validateNationalId } from 'idnumbers';",
    '',
    ...(format.example
      ? [`validateNationalId('${info.code}', '${format.example}').isValid; // true`]
      : [`validateNationalId('${info.code}', id);`]),
    '```',
    '',
    `To bundle only this country, import its definition from ${code(`idnumbers/countries/${slot}`)} ` +
      `and pass it to ${code('register()')}:`,
    '',
    '```ts',
    "import { register, validateNationalId } from 'idnumbers/core';",
    `import { country } from 'idnumbers/countries/${slot}';`,
    '',
    'register(country);',
    ...(format.example
      ? [`validateNationalId('${info.code}', '${format.example}').isValid; // true`]
      : [`validateNationalId('${info.code}', id);`]),
    '```',
  ];

  const links = metadata.links.filter(link => /^https?:\/\//.test(link));
  if (links.length > 0) {
    lines.push('', '## References', '', ...links.map(link => `- <${link}>`));
  }
  return `${lines.join('\n')}\n`;
}

function overviewPage(countries) {
  const rows = countries.map(info => {
    const format = getCountryIdFormat(info.code);
    return (
      `| [${info.code}](./countries/${slug(info.code)}.md) | ${text(info.name)} | ` +
      `${text(info.idType)} | ${yesNo(format.isParsable)} | ${yesNo(format.hasChecksum)} |`
    );
  });
  const lines = [
    '---',
    'title: Supported countries',
    'children:',
    ...countries.map(info => `  - ./countries/${slug(info.code)}.md`),
    '---',
    '',
    `${countries.length} countries are supported. Each page lists the ID format, the input ` +
      'masks, the length, an example and how to import the country on its own. The pages ' +
      'are generated from the registry metadata of the library.',
    '',
    '| Code | Country | ID type | Parsable | Checksum |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ];
  return `${lines.join('\n')}\n`;
}

// listSupportedCountries() is sorted by alpha-3 code, so the output is deterministic.
const countries = listSupportedCountries();

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(PAGES_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'countries.md'), overviewPage(countries));
for (const info of countries) {
  writeFileSync(join(PAGES_DIR, `${slug(info.code)}.md`), countryPage(info));
}

console.log(`generate-country-pages: wrote ${countries.length} country pages to build/docs/`);
