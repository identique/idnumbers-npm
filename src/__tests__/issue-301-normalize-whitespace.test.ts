/**
 * Issue #301: normalizeId() and formatId() strip the same whitespace as the Python
 * library, whose `str.isspace()` / `\s` also match the information separators
 * U+001C-U+001F and NEL U+0085 (JavaScript's `\s` doesn't).
 */
import { formatId, normalizeId } from '../index';

/** Whitespace in Python's sense that JavaScript's `\s` does not match. */
const PYTHON_ONLY_WHITESPACE = [0x1c, 0x1d, 0x1e, 0x1f, 0x85].map(codePoint =>
  String.fromCodePoint(codePoint)
);

describe('issue #301: Python-only whitespace in normalizeId() and formatId()', () => {
  it.each(PYTHON_ONLY_WHITESPACE)('U+%#x is removed (BRA)', char => {
    const withChar = `${char}111.444${char}.777-${char}35${char}`;
    const normalized = normalizeId('BRA', withChar)!;
    expect(normalized).toBe('11144477735');
    expect(normalized).not.toContain(char);

    const formatted = formatId('BRA', withChar)!;
    expect(formatted).toBe('111.444.777-35');
    expect(formatted).not.toContain(char);
  });

  it.each(PYTHON_ONLY_WHITESPACE)('U+%#x is removed and the century sign stays (FIN)', char => {
    const withChar = `${char}131052-${char}308T${char}`;
    const normalized = normalizeId('FIN', withChar)!;
    expect(normalized).toBe('131052-308T');
    expect(normalized).not.toContain(char);
    expect(formatId('FIN', withChar)).toBe('131052-308T');
  });

  it.each(PYTHON_ONLY_WHITESPACE)('U+%#x alone is stripped from an otherwise empty ID', char => {
    expect(normalizeId('TWN', char)).toBe('');
  });
});

describe('issue #301: normalizeId() and formatId() uppercase only ASCII letters', () => {
  const KEPT_AS_WRITTEN: Array<[string, number]> = [
    ['sharp s', 0xdf],
    ['long s', 0x17f],
    ['dotless i', 0x131],
    ['fi ligature', 0xfb01],
    ['lowercase Greek alpha', 0x3b1],
  ];

  it.each(KEPT_AS_WRITTEN)('keeps the %s unchanged', (_name, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(normalizeId('TWN', `a1234${char}6789`)).toBe(`A1234${char}6789`);
    expect(normalizeId('TWN', char)).toBe(char);
  });

  it('still uppercases ASCII letters', () => {
    expect(normalizeId('TWN', 'a123456789')).toBe('A123456789');
    expect(normalizeId('FIN', '131052-308t')).toBe('131052-308T');
    expect(formatId('BRA', '11144477735')).toBe('111.444.777-35');
  });
});
