# Forms Integration Guide

> **New in v2.1.0** (on `main`, not yet published to npm; [#132](https://github.com/identique/idnumbers-npm/issues/132)).
> Builds on `formatId()` / `normalizeId()` ([#128](https://github.com/identique/idnumbers-npm/issues/128))
> and `getInputMask()` ([#129](https://github.com/identique/idnumbers-npm/issues/129)) — see the
> [README](../README.md#formatidcountrycode-idnumber) for both.

A worked example of wiring an ID field into a form: a React + [react-hook-form](https://react-hook-form.com/)
component, a framework-free vanilla example, and a bundle-size comparison between the
batteries-included `idnumbers` root import and a single-country subpath import.

## The flow for an ID field

1. **Register only the countries the form needs**, through the tree-shakeable subpaths (below) —
   not the root `idnumbers` package, which registers all 85 countries.
2. **Mask while typing** with [`getInputMask(countryCode)!.imask`](../README.md#getinputmaskcountrycode),
   fed to [imask](https://imask.js.org/).
3. **On blur or paste**, run the raw value through [`formatId()`](../README.md#formatidcountrycode-idnumber)
   to lay it out in the country's display format.
4. **Validate** with [`validateNationalId()`](../README.md#validatenationalidcountrycode-idnumber), and
   optionally check the shape first with `getInputMask(countryCode)!.pattern`.
5. **Submit or store the compact form** with [`normalizeId()`](../README.md#normalizeidcountrycode-idnumber),
   not the formatted one.
6. **Map `result.reason` to a message with a `default` branch.** Reasons are best-effort and
   non-exhaustive — see [docs/FAILURE_REASONS.md](FAILURE_REASONS.md) — and a wrong check digit
   can be `checksum_mismatch` or, for a country whose `checksum()` returns a computed digit rather
   than a pass/fail, `validation_failed`. Never assume a specific reason means "wrong check digit."

## Setup

```bash
npm install idnumbers
# React example only:
npm install imask react-imask react-hook-form
```

Register only the country (or countries) the form needs, once, at module scope — not inside a
component or a handler:

```typescript
import { register } from 'idnumbers/core';
import { country as bra } from 'idnumbers/countries/bra';

register(bra);
```

The subpath is the **lowercase** alpha-3 code (`idnumbers/countries/bra`, not `BRA`): on a
case-insensitive file system, an uppercase path loads a second copy of the module with a separate
`country` definition. See [Tree-shakeable imports](../README.md#tree-shakeable-imports-v200) for
details, including why importing the root `idnumbers` anywhere in the app defeats this, since both
entries share one registry.

## React + react-hook-form example

A CPF (Brazil) field, driven by `getInputMask('BRA')!.imask`'s dynamic mask list through
[react-imask](https://github.com/uNmAnNeR/imaskjs/tree/master/packages/react-imask)'s
`IMaskInput`, wired to react-hook-form 7 with `Controller`:

```tsx
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { register, validateNationalId, normalizeId, getInputMask } from 'idnumbers/core';
import { country as bra } from 'idnumbers/countries/bra';

register(bra);

const braMask = getInputMask('BRA')!;

interface CpfFormValues {
  cpf: string;
}

function reasonMessage(reason: string | undefined): string {
  switch (reason) {
    case 'invalid_length':
      return 'CPF must be 11 digits.';
    case 'invalid_format':
      return 'CPF must look like 390.533.447-05.';
    case 'checksum_mismatch':
    case 'validation_failed':
      return 'CPF check digits do not match.';
    default:
      return 'Enter a valid CPF.';
  }
}

export function CpfField() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CpfFormValues>({ defaultValues: { cpf: '' } });

  const onSubmit = (values: CpfFormValues) => {
    const compact = normalizeId('BRA', values.cpf);
    console.log('submitting', compact);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="cpf">CPF</label>
      <Controller
        name="cpf"
        control={control}
        rules={{
          required: 'CPF is required.',
          pattern: { value: braMask.pattern, message: 'CPF must look like 390.533.447-05.' },
          validate: value => {
            const result = validateNationalId('BRA', value);
            return result.isValid || reasonMessage(result.reason);
          },
        }}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <IMaskInput
            id="cpf"
            mask={braMask.imask}
            prepareChar={(char: string) => char.toUpperCase()}
            value={value}
            unmask={false}
            onAccept={(val: string) => onChange(val)}
            onBlur={onBlur}
            inputRef={ref}
            placeholder="390.533.447-05"
          />
        )}
      />
      {errors.cpf && <span role="alert">{errors.cpf.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
}
```

Notes:

- `getInputMask('BRA')!.imask` is built from a **mask list**, but CPF only has one entry
  (`###.###.###-##`) since it comes in a single length. The dynamic behavior — `IMaskInput`
  picking the entry that fits what has been typed — matters for a country with several ID
  lengths, e.g. `getInputMask('HKG')!.masks` is `['L######(X)', 'LL######(X)']`.
- `unmask={false}` keeps the field's value formatted (`390.533.447-05`), matching what
  `braMask.pattern` and `validateNationalId()` expect; `onAccept` (not the native `onChange`) is
  react-imask's callback for the masked value, so it's what feeds react-hook-form's `onChange`.
- `rules.pattern` gives a fast, synchronous shape check; `rules.validate` runs the real checksum
  and reports a reason-based message.
- The submit handler calls `normalizeId()`, so the value sent to the server is the compact
  `39053344705`, not the display-formatted one the field holds.

## Framework-free example

No React, no imask — `formatId()` on blur, `validateNationalId()` on submit, reported through the
native [`setCustomValidity()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity)
API. Assumes a bundler or an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap)
resolves `idnumbers/core` and `idnumbers/countries/bra` for the browser.

```html
<!doctype html>
<html lang="en">
  <body>
    <form id="cpf-form" novalidate>
      <label for="cpf">CPF</label>
      <input id="cpf" name="cpf" type="text" placeholder="390.533.447-05" required />
      <button type="submit">Save</button>
    </form>

    <script type="module">
      import { register, validateNationalId, formatId, normalizeId } from 'idnumbers/core';
      import { country as bra } from 'idnumbers/countries/bra';

      register(bra);

      const form = document.getElementById('cpf-form');
      const input = document.getElementById('cpf');
      if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement)) {
        throw new Error('cpf-form markup is missing');
      }

      /** @param {string | undefined} reason */
      function reasonMessage(reason) {
        switch (reason) {
          case 'invalid_length':
            return 'CPF must be 11 digits.';
          case 'invalid_format':
            return 'CPF must look like 390.533.447-05.';
          case 'checksum_mismatch':
          case 'validation_failed':
            return 'CPF check digits do not match.';
          default:
            return 'Enter a valid CPF.';
        }
      }

      input.addEventListener('blur', () => {
        const formatted = formatId('BRA', input.value);
        if (formatted !== null) {
          input.value = formatted;
        }
      });

      form.addEventListener('submit', event => {
        event.preventDefault();
        const result = validateNationalId('BRA', input.value);
        if (!result.isValid) {
          input.setCustomValidity(reasonMessage(result.reason));
          input.reportValidity();
          return;
        }
        input.setCustomValidity('');
        const compact = normalizeId('BRA', input.value);
        console.log('submitting', compact);
      });
    </script>
  </body>
</html>
```

`formatId()` returns `null` while the input doesn't yet match any of the country's masks (for
example a partial value mid-typing), so it's meant for blur/paste, not as-you-type masking — for
that, use imask directly: `IMask(input, { mask: getInputMask('BRA')!.imask })`.

`getInputMask('BRA')!.pattern.source` can be put into an HTML `pattern` attribute
(`input.pattern = braMask.pattern.source`) for a native, as-you-type shape hint: a browser anchors
it (`^(?:<value>)$`) and compiles it under the Unicode-set (`v`) regex flag, both of which
`pattern.source` is built to satisfy. It's a shape check only, same as the `RegExp` object itself
— it can allow more than a valid ID does ([README](../README.md#getinputmaskcountrycode)) — so the real validation still happens on
submit, with `setCustomValidity()` and `validateNationalId()`.

## Bundle size

Importing `idnumbers/core` plus one `idnumbers/countries/<iso3>` subpath instead of the root
`idnumbers` package keeps a form's ID-handling code out of the bundle for every country the form
doesn't use. Measured with [esbuild](https://esbuild.github.io/) (bundle, minify, `format: esm`,
`platform: browser`, `target: es2020`, gzip level 9 — the same settings `npm run size` uses),
bundling `validateNationalId`, `formatId`, `normalizeId`, and `getInputMask` for Brazil (BRA) on
v2.1.0 `main`:

| Import                                       | min+gzip |  minified |
| -------------------------------------------- | -------: | --------: |
| `idnumbers` (root, all 85 countries)         | 39,896 B | 139,156 B |
| `idnumbers/core` + `idnumbers/countries/bra` |  2,919 B |   7,385 B |

That's about **13.7x** smaller. Validation alone (no `formatId`/`normalizeId`/`getInputMask`) with
core plus one subpath runs 2.0–5.5 kB min+gzip across all 85 countries (as `npm run size` measures
it; the per-country budget is 6 kB), depending on how much validation logic that country needs.

These numbers will vary with your bundler, its settings, and the library version — re-measure for
your own build. And keep in mind that **importing the root `idnumbers` anywhere in an app**
registers every country in the one shared registry, so a subpath import elsewhere in the same app
doesn't save anything — the win only holds if the whole app sticks to `idnumbers/core` plus
subpaths.
