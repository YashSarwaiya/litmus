# Expected Behaviors — calculator-subtract

Derived solely from `/Users/YashSarwaiya1/Desktop/expect/.claude/specs/calculator-subtract.md`.

Requirement (verbatim): "subtract two numbers and return the result"

Clarifications relied upon:
- Inputs: two numbers passed as arguments; integers or decimals; negatives allowed.
- Operation: return the first number minus the second; order matters.
- Output: the numeric result is returned (plain function, no display styling).
- Edge cases: assume valid numeric input; invalid/empty input is out of scope.

---

## B1 — Subtract two numbers and return the difference

- **behavior:** Given two numbers as arguments, the function returns the first number minus the second.
- **cases:**
  - `subtract(5, 3)` → `2`
  - `subtract(10, 4)` → `6`
  - `subtract(0, 0)` → `0`
- **testability:** auto

## B2 — Order of operands matters (first minus second, not commutative)

- **behavior:** The subtraction is directional; swapping the arguments changes the result (first - second).
- **cases:**
  - `subtract(3, 5)` → `-2`
  - `subtract(5, 3)` → `2` (contrast with above to confirm order matters)
- **testability:** auto

## B3 — Supports decimal (non-integer) inputs

- **behavior:** The function accepts decimal numbers and returns the correct decimal difference.
- **cases:**
  - `subtract(5.5, 2.0)` → `3.5`
  - `subtract(2.75, 1.25)` → `1.5`
  - `subtract(0.3, 0.1)` → `0.2` (approximately; allow for floating-point tolerance)
- **testability:** auto

## B4 — Supports negative inputs

- **behavior:** The function accepts negative numbers for either or both operands and returns the correct difference.
- **cases:**
  - `subtract(-5, 3)` → `-8`
  - `subtract(5, -3)` → `8`
  - `subtract(-5, -3)` → `-2`
- **testability:** auto

## B5 — Returns a numeric value

- **behavior:** The result is returned as a number (the numeric result is returned; no display/formatting/styling is applied).
- **cases:**
  - `typeof subtract(5, 3)` → `"number"`
  - `subtract(5, 3)` → `2` (returned, not printed/logged/formatted as a string)
- **testability:** auto

---

### Notes / out of scope (recorded, not tested)

- Invalid or empty input handling is explicitly out of scope per the clarifications; no behavior is asserted for non-numeric or missing arguments.
- No display styling is required; only the returned numeric value matters.
