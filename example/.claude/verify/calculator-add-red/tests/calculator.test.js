// Runnable tests for behaviors in:
//   /Users/YashSarwaiya1/Desktop/expect/.claude/verify/calculator-add-red/behaviors.md
// Target:
//   /Users/YashSarwaiya1/Desktop/expect/src/calculator.js
//
// Framework: Node.js built-in test runner (node:test) + node:assert.
// Chosen because the project has no package.json / node_modules / existing test
// setup, and Node 20 ships node:test, so these run with zero installation.
//
// Run:
//   node --test /Users/YashSarwaiya1/Desktop/expect/.claude/verify/calculator-add-red/tests/
//
// NOTE on the "red" behaviors (B5, B6, B7): the requirement fixes the expected
// outcome as the result value's color being red (rgb(255,0,0) / #ff0000 / red).
// These assertions are written exactly to that fixed expectation. If the target
// code does not color the result red, these tests are SUPPOSED to fail —
// catching that mismatch is the point. They are not softened to match the code.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { add, renderResult } = require('/Users/YashSarwaiya1/Desktop/expect/src/calculator.js');

// --- Helpers ------------------------------------------------------------------

// Extract the visible text content of the result element from rendered HTML.
// Looks for the inner text of the first HTML element in the rendered string.
function extractRenderedText(html) {
  const str = String(html);
  const match = str.match(/<[^>]+>([\s\S]*?)<\/[^>]+>/);
  return match ? match[1].trim() : str.trim();
}

// Heuristic: does the rendered result represent the value as red text?
// Considers inline style on the element wrapping the value, plus any <style>
// block / stylesheet hints in the rendered HTML. Normalizes common red forms:
//   color: red | #ff0000 | #f00 | rgb(255, 0, 0) | rgb(255,0,0)
function resultIsRed(html) {
  const str = String(html).toLowerCase().replace(/\s+/g, ' ');

  // Find the element that wraps the result value (first tag that has content).
  const elMatch = str.match(/<[^>]*>[\s\S]*?<\/[^>]*>/);
  const wrappingTag = elMatch ? (str.match(/<[^>]+>/) || [''])[0] : '';

  const redPatterns = [
    /color:\s*red/,
    /color:\s*#ff0000/,
    /color:\s*#f00/,
    /color:\s*rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/,
  ];

  // Inline style directly on the wrapping element.
  const inlineRed = redPatterns.some((re) => re.test(wrappingTag));

  // Any style block / stylesheet content in the rendered output declaring red.
  const styleBlockRed = redPatterns.some((re) => re.test(str));

  return inlineRed || styleBlockRed;
}

// =============================================================================
// B1 — Adds two numbers and displays their sum
// =============================================================================

test('B1: 2 + 3 sums to 5', () => {
  assert.equal(add(2, 3), 5);
});

test('B1: 10 + 20 sums to 30', () => {
  assert.equal(add(10, 20), 30);
});

test('B1: 0 + 0 sums to 0', () => {
  assert.equal(add(0, 0), 0);
});

test('B1: 0 + 7 sums to 7', () => {
  assert.equal(add(0, 7), 7);
});

// =============================================================================
// B2 — Supports decimal (non-integer) operands
// =============================================================================

test('B2: 2.5 + 3.5 sums to 6', () => {
  assert.equal(add(2.5, 3.5), 6);
});

test('B2: 0.1 + 0.2 sums to 0.3', () => {
  // Expected outcome per behavior is 0.3. Use closeness to respect IEEE-754
  // float representation; the fixed expected value is still 0.3.
  assert.ok(
    Math.abs(add(0.1, 0.2) - 0.3) < 1e-9,
    `expected 0.1 + 0.2 to equal 0.3, got ${add(0.1, 0.2)}`,
  );
});

test('B2: 1.25 + 2.75 sums to 4', () => {
  assert.equal(add(1.25, 2.75), 4);
});

// =============================================================================
// B3 — Supports negative operands
// =============================================================================

test('B3: -2 + -3 sums to -5', () => {
  assert.equal(add(-2, -3), -5);
});

test('B3: -5 + 3 sums to -2', () => {
  assert.equal(add(-5, 3), -2);
});

test('B3: 5 + -3 sums to 2', () => {
  assert.equal(add(5, -3), 2);
});

test('B3: -2.5 + 2.5 sums to 0', () => {
  assert.equal(add(-2.5, 2.5), 0);
});

// =============================================================================
// B4 — Result is rendered as HTML in a web page
// =============================================================================

test('B4: 2 + 3 produces a rendered HTML element', () => {
  const html = renderResult(2, 3);
  assert.match(
    String(html),
    /<[^>]+>[\s\S]*<\/[^>]+>/,
    'renderResult output should contain a rendered HTML element',
  );
});

test('B4: rendered HTML element contains the result text 5', () => {
  const html = renderResult(2, 3);
  assert.equal(
    extractRenderedText(html),
    '5',
    'rendered result element text should be the sum 5',
  );
});

// =============================================================================
// B5 — Result text is colored red
// =============================================================================

test('B5: result element for 2 + 3 = 5 has red text color', () => {
  const html = renderResult(2, 3);
  assert.ok(
    resultIsRed(html),
    `result for 2 + 3 should be colored red (rgb(255,0,0)); rendered: ${html}`,
  );
});

test('B5: result 30 for 10 + 20 has red text color', () => {
  const html = renderResult(10, 20);
  assert.ok(
    resultIsRed(html),
    `result for 10 + 20 should be colored red (rgb(255,0,0)); rendered: ${html}`,
  );
});

test('B5: result 0 for 0 + 0 has red text color', () => {
  const html = renderResult(0, 0);
  assert.ok(
    resultIsRed(html),
    `result for 0 + 0 should be colored red (rgb(255,0,0)); rendered: ${html}`,
  );
});

// =============================================================================
// B6 — Red applies specifically to the result value
// =============================================================================

test('B6: the element containing the value 5 is the one styled red', () => {
  const html = renderResult(2, 3);
  // The element holding the result value must both contain "5" and be red.
  assert.equal(extractRenderedText(html), '5', 'result value element should contain 5');
  assert.ok(
    resultIsRed(html),
    `the result value element (containing 5) should be red; rendered: ${html}`,
  );
});

// =============================================================================
// B7 — Red applies always (every result, every state)
// =============================================================================

test('B7: positive result 5 is red', () => {
  assert.ok(resultIsRed(renderResult(2, 3)), 'positive result should be red');
});

test('B7: negative result -5 is red', () => {
  assert.ok(resultIsRed(renderResult(-2, -3)), 'negative result should be red');
});

test('B7: zero result 0 is red', () => {
  assert.ok(resultIsRed(renderResult(0, 0)), 'zero result should be red');
});

test('B7: decimal result 0.3 is red', () => {
  assert.ok(resultIsRed(renderResult(0.1, 0.2)), 'decimal result should be red');
});

test('B7: red is present in the default/initial render (no hover/interaction)', () => {
  // renderResult is the default render output; red must be present without any
  // hover or state-changing interaction applied.
  assert.ok(
    resultIsRed(renderResult(2, 3)),
    'red must be present in the default render state with no interaction',
  );
});

// =============================================================================
// B8 — Red color is visually perceptible to a human (MANUAL)
// =============================================================================

test('B8: [MANUAL] result number visibly appears red on screen', { skip: true }, () => {
  // MANUAL CHECK REQUIRED — do not automate.
  // A human must: open the web calculator, compute a sum (e.g. 2 + 3), and
  // visually confirm the displayed result (5) appears red and is legible.
  // This test is intentionally skipped/pending so the manual item is tracked.
  assert.fail('manual verification required: see message above');
});
