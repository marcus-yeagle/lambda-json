const evaluate = require('../λJSON').default;
test('evaluates a λJSON string to JS string', () => {
  expect(evaluate('foo', {})).toBe('foo');
});
test('evaluates a λJSON string to JS string', () => {
  expect(evaluate('bar', {})).toBe('bar');
});
