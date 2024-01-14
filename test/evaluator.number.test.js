const { evaluate } = require('../λjson.js');
test('evaluates a λ.json number to JS number', () => {
  expect(evaluate(42, {})).toBe(42);
});

test('evaluates a negative λ.json number to a negative JS number', () => {
  expect(evaluate(-3, {})).toBe(-3);
});

test('evaluates 0 to 0', () => {
  expect(evaluate(0, {})).toBe(0);
});

test('evaluates Infinity to Infinity', () => {
  expect(evaluate(Infinity, {})).toBe(Infinity);
});
