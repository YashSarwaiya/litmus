---
slug: calculator-add-red
created: 2026-06-06
status: locked
---

## Requirement (verbatim — source of truth)

build a calculator that adds two numbers AND shows the result in red

## Clarifications

(User answers to the auditor's questions, appended verbatim.)

- Inputs: two numbers. Integers or decimals, and negatives are allowed.
- Operation: the calculator returns/displays the sum of the two numbers
  (e.g. 2 + 3 = 5).
- Display medium: this is a web calculator — the result is shown as rendered
  HTML.
- "in red": the result number's text is colored red — CSS `color: red`
  (equivalently `#ff0000` / `rgb(255, 0, 0)`). The red applies to the result
  value, and it applies always (not only on certain states).
- Edge cases: for this version, assume valid numeric input; invalid/empty input
  handling is out of scope.
