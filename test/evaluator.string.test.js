const { evaluate } = require('../λjson.js');
test('evaluates a λ.json string to JS string', () => {
  expect(evaluate('foo', {})).toBe('foo');
});
test('evaluates a λ.json string to JS string', () => {
  expect(evaluate('bar', {})).toBe('bar');
});
