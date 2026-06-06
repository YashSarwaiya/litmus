// Calculator module.

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// Renders the result of adding two numbers for display, in red.
function renderResult(a, b) {
  return `<span class="result" style="color: red">${add(a, b)}</span>`;
}

module.exports = { add, subtract, renderResult };
