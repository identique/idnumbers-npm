/**
 * ASCII-only case folding (#298).
 *
 * `String.prototype.toUpperCase()` turns some non-ASCII letters into ASCII ones
 * (the long s into `S`, the dotless i into `I`, the `fi` ligature into `FI`, the
 * sharp s into `SS`). Uppercasing before an ASCII-only check would let those
 * lookalikes pass it.
 */

/**
 * Uppercase the ASCII letters `a`-`z` only. Every other character, including the
 * lookalikes above, is left unchanged, so ASCII-only checks reject them, as the
 * Python library does.
 */
export function asciiUpperCase(value: string): string {
  return value.replace(/[a-z]+/g, letters => letters.toUpperCase());
}
