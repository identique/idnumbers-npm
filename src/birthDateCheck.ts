/**
 * Birth-date check tracing (#130).
 *
 * Country modules wrap each birth-date check that their `validate()` path reaches
 * in `invalidBirthDate(...)`. The wrapper returns its boolean argument unchanged,
 * so wrapping a check can never change what `validate()` returns — it only lets
 * `deriveFailureReason()` (src/registry/failureReason.ts) notice, after the fact,
 * that the rejection came from a birth-date check rather than from something else,
 * by re-running `validate()` inside `rejectsBirthDate(...)` and watching for a
 * wrapped check that fired `true` during that run.
 *
 * Caveat: this only works when the country module and the registry resolve to the
 * SAME loaded copy of this module. If they instead load two separate copies (for
 * example, one reached through the CJS build and the other through the ESM build),
 * the trace in one copy is invisible to the other, the derivation can't see the
 * check fire, and the reason falls back to `validation_failed`. Validity itself is
 * never affected either way, since `invalidBirthDate` always returns its argument.
 */

/** Whether a traced run hit a failed birth-date check; undefined outside a trace. */
let rejected: boolean | undefined;

/**
 * Wrap a birth-date check's boolean result. Returns `invalid` unchanged; when a
 * trace is active (see `rejectsBirthDate`) and this is the first wrapped check in
 * that trace to fire `true`, records that the run rejected on a birth date.
 */
export function invalidBirthDate(invalid: boolean): boolean {
  if (invalid && rejected === false) {
    rejected = true;
  }
  return invalid;
}

/**
 * Run `validate` under a birth-date trace and report whether any `invalidBirthDate`
 * call inside it fired `true`. Never throws: a validator that throws is still
 * judged by whichever checks it ran before throwing.
 */
export function rejectsBirthDate(validate: () => unknown): boolean {
  const outer = rejected;
  rejected = false;
  try {
    validate();
  } catch {
    // A validator that throws is still judged by the checks it ran before throwing.
  }
  const result = rejected;
  rejected = outer;
  return result;
}
