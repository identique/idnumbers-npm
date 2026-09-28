import { getCountryIdFormat, listSupportedCountries, validateNationalId } from '../../index';

/** Separator characters probed in place of an example's own separators. */
const SEPARATORS = [' ', '-', '.', '/'] as const;
/** Characters removed to form the compact variant. */
const COMPACT_STRIP = /[\s.\-/()]/g;
/** Separators that can be swapped for another separator. */
const SWAPPABLE = /[\s.\-/]/g;

/** One country's row in docs/INPUT_FORMATS.md: how its validator treats input variants. */
export interface InputFormatRow {
  code: string;
  /** The example written with separators, or null when the ID has no separated form. */
  separated: string | null;
  separatedAccepted: boolean | null;
  /** The example with separators and brackets removed. */
  compact: string;
  compactAccepted: boolean;
  /** Separators that are accepted in place of the separated form's own, e.g. `[' ']`. */
  otherSeparators: string[] | null;
  /** Whether the example in lowercase is accepted; null when it has no letters. */
  lowercaseAccepted: boolean | null;
  /** Whether the example with a leading and a trailing space is accepted. */
  paddedAccepted: boolean;
}

/**
 * The example written in its display format, when the display format is a plain
 * sequence of placeholders and separators (e.g. `YY.MM.DD-SSS.CC`) with one
 * placeholder per character of the compact example.
 */
function separatedFromDisplayFormat(compact: string, format: string | undefined): string | null {
  if (!format || !/^[A-Za-z0-9#]+(?:[ .\-/][A-Za-z0-9#]+)+$/.test(format)) return null;
  const placeholders = format.replace(/[ .\-/]/g, '');
  if (placeholders.length !== compact.length) return null;
  let next = 0;
  return format.replace(/[A-Za-z0-9#]/g, () => compact[next++]);
}

/** Probe how `code`'s validator treats case, surrounding whitespace, and separators. */
export function probeInputFormat(code: string): InputFormatRow {
  const format = getCountryIdFormat(code)!;
  const example = format.example!;
  const accepts = (id: string) => validateNationalId(code, id).isValid;

  const compact = example.replace(COMPACT_STRIP, '');
  const separated =
    example !== compact ? example : separatedFromDisplayFormat(compact, format.format);
  const swappable = separated !== null && separated.replace(SWAPPABLE, '') !== separated;

  return {
    code,
    separated,
    separatedAccepted: separated === null ? null : accepts(separated),
    compact,
    compactAccepted: accepts(compact),
    otherSeparators: swappable
      ? SEPARATORS.filter(separator => {
          const swapped = separated!.replace(SWAPPABLE, separator);
          return swapped !== separated && accepts(swapped);
        })
      : null,
    lowercaseAccepted: /[A-Za-z]/.test(example) ? accepts(example.toLowerCase()) : null,
    paddedAccepted: accepts(` ${example} `),
  };
}

const yesNo = (value: boolean | null) => (value === null ? '—' : value ? 'yes' : 'no');
const code = (value: string) => `\`${value}\``;
const separatorName = (separator: string) => (separator === ' ' ? 'space' : code(separator));

/** Render a row as a Markdown table line. */
export function renderInputFormatRow(row: InputFormatRow): string {
  const cells = [
    row.code,
    row.separated === null ? '—' : code(row.separated),
    yesNo(row.separatedAccepted),
    code(row.compact),
    yesNo(row.compactAccepted),
    row.otherSeparators === null
      ? '—'
      : row.otherSeparators.length === 0
        ? 'none'
        : row.otherSeparators.map(separatorName).join(', '),
    yesNo(row.lowercaseAccepted),
    yesNo(row.paddedAccepted),
  ];
  return `| ${cells.join(' | ')} |`;
}

/** Every registered country's row, sorted by alpha-3 code. */
export function inputFormatRows(): InputFormatRow[] {
  return listSupportedCountries().map(country => probeInputFormat(country.code));
}
