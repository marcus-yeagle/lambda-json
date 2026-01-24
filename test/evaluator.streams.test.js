const { evaluate, globalEnv } = require('../λjson.js');

test('evaluates a stream of integers and takes the first 5 elements', () => {
  // Define the integers-from stream generator
  evaluate(
    [
      "define",
      "integers-from",
      [
        "lambda",
        ["n"],
        ["cons-stream", "n", ["integers-from", ["+", "n", 1]]]
      ]
    ],
    globalEnv
  );

  // Define the integers stream starting from 1
  evaluate(
    ["define", "integers", ["integers-from", 1]],
    globalEnv
  );

  // Test taking the first 5 elements from the stream
  const result = evaluate(["take", 5, "integers"], globalEnv);
  
  expect(result).toEqual([1, 2, 3, 4, 5]);
  expect(Array.isArray(result)).toBe(true);
});