#!/usr/bin/env python3
"""Issue #133: report which inputs the Python idnumbers library accepts.

Helper for scripts/parity/check-parity.mjs (see docs/PARITY.md). Pure standard
library, Python 3.9 or newer.

Usage:
    python3 scripts/parity/python_validity.py <path-to-python-idnumbers-checkout>

stdin:  {"<ISO3>": ["input", ...], ...}
stdout: {"<ISO3>": [[raw_valid, any_form_valid], ...], ...}, in input order

`raw_valid` is whether the library accepts the input exactly as given.
`any_form_valid` is whether it accepts the input, or one of a few renderings of
it (upper-cased, separators removed, or laid out the way the library expects).
The Node.js side uses the second flag to tell "TS accepts a format Python
rejects" apart from a real disagreement about the identifier itself.
"""
import importlib
import json
import os
import re
import sys

# Separators the TypeScript validators strip before validating.
SEPARATORS = re.compile(r"[\s.\-/()]")

# TS registry country -> Python classes as "module:Class", relative to
# idnumbers.nationalid. An input is valid when any class accepts it. The default
# is "<CODE>:NationalID"; these countries differ.
CLASS_OVERRIDES = {
    # Python's AUS.NationalID aliases the driver licence; TS registers Medicare.
    "AUS": ["aus.medicare:MedicareNumber"],
    # Python's GRC.NationalID aliases the identity card; TS registers the tax ID.
    "GRC": ["grc.tax_id:TaxIdentityNumber"],
    # TS registers each of these as a union of the current and the old format.
    "BGD": ["BGD:NationalID", "BGD:OldNationalID"],
    "LKA": ["LKA:NationalID", "LKA:OldNationalID"],
    # TS registers the social security and the tax registration numbers together.
    "SMR": ["SMR:SocialSecurityNumber", "SMR:TaxRegistrationNumber"],
}


def fail(message):
    print(f"python_validity.py: {message}", file=sys.stderr)
    sys.exit(2)


def import_checkout(path):
    """Import `idnumbers` from the given checkout, never from site-packages."""
    root = os.path.realpath(path)
    if not os.path.isfile(os.path.join(root, "idnumbers", "nationalid", "__init__.py")):
        fail(f"{path} is not a checkout of the Python idnumbers library")
    sys.path.insert(0, root)
    idnumbers = importlib.import_module("idnumbers")
    loaded_from = os.path.realpath(idnumbers.__file__)
    if os.path.commonpath([root, loaded_from]) != root:
        fail(f"imported idnumbers from {loaded_from}, not from the checkout {root}")


def load_classes(code):
    classes = []
    for spec in CLASS_OVERRIDES.get(code, [f"{code}:NationalID"]):
        module_name, class_name = spec.split(":")
        try:
            module = importlib.import_module(f"idnumbers.nationalid.{module_name}")
            classes.append(getattr(module, class_name))
        except (ImportError, AttributeError) as error:
            fail(f"cannot load the Python class for {code} ({spec}): {error}")
    return classes


def validate(classes, value):
    for cls in classes:
        try:
            if cls.validate(value) is True:
                return True
        except Exception:  # noqa: BLE001
            # Python raises (for example OverflowError for some LKA dates) where
            # TS returns false, so an exception counts as invalid.
            pass
    return False


def canonical_layouts(code, compact):
    """Layouts Python requires where TS also accepts the compact form."""
    if code == "NLD" and re.fullmatch(r"\d{9}", compact):
        return [f"{compact[0:4]}.{compact[4:6]}.{compact[6:9]}"]
    if code == "CHE" and re.fullmatch(r"\d{13}", compact):
        return [f"{compact[0:3]}.{compact[3:7]}.{compact[7:11]}.{compact[11:13]}"]
    if code == "CHL" and re.fullmatch(r"\d{7,8}[\dK]", compact):
        body, check = compact[:-1], compact[-1]
        return [f"{body[:-6]}.{body[-6:-3]}.{body[-3:]}-{check}"]
    if code == "SWE" and re.fullmatch(r"\d{10}", compact):
        return [f"{compact[:6]}-{compact[6:]}"]
    return []


def other_forms(code, value):
    compact = SEPARATORS.sub("", value)
    upper = compact.upper()
    return [value.upper(), compact, upper, *canonical_layouts(code, upper)]


def check(code, classes, value):
    raw_valid = validate(classes, value)
    any_form_valid = raw_valid or any(validate(classes, form) for form in other_forms(code, value))
    return [raw_valid, any_form_valid]


def main():
    if len(sys.argv) != 2:
        fail("usage: python_validity.py <path-to-python-idnumbers-checkout>")
    import_checkout(sys.argv[1])
    requested = json.load(sys.stdin)
    result = {}
    for code, values in requested.items():
        classes = load_classes(code)
        result[code] = [check(code, classes, value) for value in values]
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
