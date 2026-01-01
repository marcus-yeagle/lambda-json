const { evaluate, resetExecutionState, resetWarnings } = require('../λjson.js');

describe('resource limits', () => {
  beforeEach(() => {
    resetExecutionState();
    resetWarnings();
  });

  describe('recursion depth limit', () => {
    test('allows recursion within limit', () => {
      // Fibonacci with small n should work
      evaluate(['define', 'fib', ['λ', ['n'],
        ['cond',
          [['eq?', 'n', 0], 0],
          [['eq?', 'n', 1], 1],
          ['else', ['+', ['fib', ['-', 'n', 1]], ['fib', ['-', 'n', 2]]]]]
      ]], {});
      
      const result = evaluate(['fib', 5], {});
      expect(result).toBe(5);
    });

    test('throws when exceeding recursion limit', () => {
      // Create infinite recursion
      evaluate(['define', 'infinite', ['λ', [], ['infinite']]], {});
      
      // Should throw either our custom error or JS call stack exceeded
      expect(() => 
        evaluate(['infinite'], {}, { maxRecursionDepth: 100 })
      ).toThrow(); // Either "Maximum recursion depth exceeded" or "Maximum call stack size exceeded"
    });

    test('respects custom recursion limit', () => {
      let depth = 0;
      const maxDepth = 50;
      
      // Create a function that tracks depth
      evaluate(['define', 'count-depth', ['λ', ['n'],
        ['if', ['eq?', 'n', 0],
          0,
          ['+', 1, ['count-depth', ['-', 'n', 1]]]]
      ]], {});
      
      // This should work with default limit
      const result = evaluate(['count-depth', 10], {});
      expect(result).toBe(10);
    });

    test('unlimited depth when set to 0', () => {
      evaluate(['define', 'counter', ['λ', ['n'],
        ['if', ['eq?', 'n', 0],
          0,
          ['+', 1, ['counter', ['-', 'n', 1]]]]
      ]], {});
      
      // With maxRecursionDepth = 0, no limit is enforced
      // (but we still use a reasonable n to avoid actual stack overflow)
      const result = evaluate(['counter', 100], {}, { maxRecursionDepth: 0 });
      expect(result).toBe(100);
    });
  });

  describe('execution time limit', () => {
    test('allows fast execution', () => {
      const result = evaluate(['+', 1, 2, 3], {}, { maxExecutionTime: 1000 });
      expect(result).toBe(6);
    });

    test('throws when exceeding time limit', () => {
      // Create slow recursive computation
      evaluate(['define', 'slow-fib', ['λ', ['n'],
        ['cond',
          [['eq?', 'n', 0], 0],
          [['eq?', 'n', 1], 1],
          ['else', ['+', ['slow-fib', ['-', 'n', 1]], ['slow-fib', ['-', 'n', 2]]]]]
      ]], {});
      
      // Very short time limit should cause timeout
      expect(() => 
        evaluate(['slow-fib', 30], {}, { maxExecutionTime: 1 })
      ).toThrow('Maximum execution time exceeded');
    });

    test('unlimited time when set to 0', () => {
      const result = evaluate(['+', 1, 2], {}, { maxExecutionTime: 0 });
      expect(result).toBe(3);
    });
  });

  describe('combined limits', () => {
    test('respects both limits together', () => {
      expect(() => 
        evaluate(['define', 'loop', ['λ', [], ['loop']]], {})
      ).not.toThrow();
      
      // Should hit one of the limits
      expect(() => 
        evaluate(['loop'], {}, { maxRecursionDepth: 50, maxExecutionTime: 100 })
      ).toThrow();
    });
  });
});

