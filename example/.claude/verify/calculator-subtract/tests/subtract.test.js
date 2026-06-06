// Tests for the calculator-subtract behaviors.
//
// Source of truth: /Users/YashSarwaiya1/Desktop/expect/.claude/verify/calculator-subtract/behaviors.md
// Target code:     /Users/YashSarwaiya1/Desktop/expect/src/calculator.js
//
// Framework: Node.js built-in test runner (node:test) + node:assert/strict.
// No third-party dependencies are required; this runs on Node 18+ (verified on v20).
//
// Run:
//   node --test /Users/YashSarwaiya1/Desktop/expect/.claude/verify/calculator-subtract/tests/
//
// The expected outputs below come straight from behaviors.md and are intentionally
// NOT adjusted to match the current implementation. If the target code is wrong,
// these tests should fail — that is the point.

const test = require('node:test');
const assert = require('node:assert/strict');

const { subtract } = require('/Users/YashSarwaiya1/Desktop/expect/src/calculator.js');

// B1 — Subtract two numbers and return the difference
test('B1: subtract(5, 3) returns 2', () => {
  assert.equal(subtract(5, 3), 2);
});

test('B1: subtract(10, 4) returns 6', () => {
  assert.equal(subtract(10, 4), 6);
});

test('B1: subtract(0, 0) returns 0', () => {
  assert.equal(subtract(0, 0), 0);
});

// B2 — Order of operands matters (first minus second, not commutative)
test('B2: subtract(3, 5) returns -2', () => {
  assert.equal(subtract(3, 5), -2);
});

test('B2: subtract(5, 3) returns 2 (contrast confirms order matters)', () => {
  assert.equal(subtract(5, 3), 2);
});

// B3 — Supports decimal (non-integer) inputs
test('B3: subtract(5.5, 2.0) returns 3.5', () => {
  assert.equal(subtract(5.5, 2.0), 3.5);
});

test('B3: subtract(2.75, 1.25) returns 1.5', () => {
  assert.equal(subtract(2.75, 1.25), 1.5);
});

test('B3: subtract(0.3, 0.1) returns approximately 0.2 (float tolerance)', () => {
  // behaviors.md explicitly allows floating-point tolerance for this case.
  assert.ok(
    Math.abs(subtract(0.3, 0.1) - 0.2) < 1e-9,
    `expected subtract(0.3, 0.1) to be approximately 0.2, got ${subtract(0.3, 0.1)}`,
  );
});

// B4 — Supports negative inputs
test('B4: subtract(-5, 3) returns -8', () => {
  assert.equal(subtract(-5, 3), -8);
});

test('B4: subtract(5, -3) returns 8', () => {
  assert.equal(subtract(5, -3), 8);
});

test('B4: subtract(-5, -3) returns -2', () => {
  assert.equal(subtract(-5, -3), -2);
});

// B5 — Returns a numeric value
test('B5: typeof subtract(5, 3) is "number"', () => {
  assert.equal(typeof subtract(5, 3), 'number');
});

test('B5: subtract(5, 3) returns the number 2 (not a formatted string)', () => {
  const result = subtract(5, 3);
  assert.equal(typeof result, 'number');
  assert.strictEqual(result, 2);
});
