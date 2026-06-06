# Expected Behaviors — calculator-add-red

Source requirement (verbatim): "build a calculator that adds two numbers AND shows the result in red"

Clarifications applied:
- Inputs: two numbers; integers or decimals; negatives allowed.
- Operation: returns/displays the sum of the two numbers.
- Display medium: web calculator; result shown as rendered HTML.
- "in red": result number text is `color: red` (= `#ff0000` / `rgb(255, 0, 0)`), applied to the result value, always (not state-dependent).
- Edge cases: assume valid numeric input; invalid/empty input handling is out of scope.

---

## B1 — Adds two numbers and displays their sum

**Behavior:** The calculator takes two numbers as input and outputs/displays their arithmetic sum.

**Cases:**
- `2, 3` → `5`
- `10, 20` → `30`
- `0, 0` → `0`
- `0, 7` → `7`

**Testability:** auto

---

## B2 — Supports decimal (non-integer) operands

**Behavior:** The calculator correctly sums decimal numbers, not just integers.

**Cases:**
- `2.5, 3.5` → `6` (or `6.0`)
- `0.1, 0.2` → `0.3`
- `1.25, 2.75` → `4` (or `4.0`)

**Testability:** auto

---

## B3 — Supports negative operands

**Behavior:** The calculator correctly sums negative numbers, including mixed-sign inputs.

**Cases:**
- `-2, -3` → `-5`
- `-5, 3` → `-2`
- `5, -3` → `2`
- `-2.5, 2.5` → `0`

**Testability:** auto

---

## B4 — Result is rendered as HTML in a web page

**Behavior:** The result is presented as rendered HTML in a web calculator (not, e.g., a console/CLI-only value).

**Cases:**
- Computing `2 + 3` → a rendered HTML element contains the result text `5`
- The result `5` is visible in the page's rendered output

**Testability:** auto

---

## B5 — Result text is colored red

**Behavior:** The displayed result value's text is colored red, equivalent to CSS `color: red` / `#ff0000` / `rgb(255, 0, 0)`.

**Cases:**
- Result element for `2 + 3 = 5` → computed text color is `rgb(255, 0, 0)`
- Result `30` for `10 + 20` → computed text color is `rgb(255, 0, 0)`
- Result `0` for `0 + 0` → computed text color is `rgb(255, 0, 0)`

**Testability:** auto

---

## B6 — Red applies specifically to the result value

**Behavior:** The red color applies to the result number itself (the result value), not merely to surrounding/incidental text.

**Cases:**
- For `2 + 3` → the element containing the value `5` has computed color `rgb(255, 0, 0)`
- The styled red element is the result value element, not an unrelated label

**Testability:** auto

---

## B7 — Red applies always (every result, every state)

**Behavior:** The result is red for all results regardless of state — not only on certain conditions (e.g., not only on errors, hover, or negative values).

**Cases:**
- Positive result `5` → red
- Negative result `-5` → red
- Zero result `0` → red
- Decimal result `0.3` → red
- Red present in default/initial render state (no hover or special interaction required)

**Testability:** auto

---

## B8 — Red color is visually perceptible to a human

**Behavior:** A human visually confirms the displayed result number appears red on screen (subjective visual check that the styling renders as intended and is legible).

**Cases:**
- Open the web calculator, compute a sum (e.g. `2 + 3`) → the displayed `5` visibly appears red

**Testability:** manual
