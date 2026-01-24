const { evaluate, globalEnv } = require('../λjson.js');

// ============================================
// Comparison Operators: >=, <=
// ============================================

describe('greater than or equal (>=)', () => {
  test('returns true for 5 >= 3', () => {
    expect(evaluate(['>=', 5, 3], {})).toBe(true);
  });

  test('returns true for 5 >= 5', () => {
    expect(evaluate(['>=', 5, 5], {})).toBe(true);
  });

  test('returns false for 3 >= 5', () => {
    expect(evaluate(['>=', 3, 5], {})).toBe(false);
  });

  test('handles chain comparison 10 >= 5 >= 3', () => {
    expect(evaluate(['>=', 10, 5, 3], {})).toBe(true);
  });

  test('returns false when chain breaks', () => {
    expect(evaluate(['>=', 10, 5, 7], {})).toBe(false);
  });

  test('returns true for single argument', () => {
    expect(evaluate(['>=', 5], {})).toBe(true);
  });

  test('returns true for empty arguments', () => {
    expect(evaluate(['>='], {})).toBe(true);
  });
});

describe('less than or equal (<=)', () => {
  test('returns true for 3 <= 5', () => {
    expect(evaluate(['<=', 3, 5], {})).toBe(true);
  });

  test('returns true for 5 <= 5', () => {
    expect(evaluate(['<=', 5, 5], {})).toBe(true);
  });

  test('returns false for 5 <= 3', () => {
    expect(evaluate(['<=', 5, 3], {})).toBe(false);
  });

  test('handles chain comparison 3 <= 5 <= 10', () => {
    expect(evaluate(['<=', 3, 5, 10], {})).toBe(true);
  });

  test('returns false when chain breaks', () => {
    expect(evaluate(['<=', 3, 10, 5], {})).toBe(false);
  });

  test('returns true for single argument', () => {
    expect(evaluate(['<=', 5], {})).toBe(true);
  });

  test('returns true for empty arguments', () => {
    expect(evaluate(['<='], {})).toBe(true);
  });
});

// ============================================
// Modulo Operator: %
// ============================================

describe('modulo (%)', () => {
  test('computes 10 % 3 = 1', () => {
    expect(evaluate(['%', 10, 3], {})).toBe(1);
  });

  test('computes 15 % 5 = 0', () => {
    expect(evaluate(['%', 15, 5], {})).toBe(0);
  });

  test('handles negative dividend', () => {
    expect(evaluate(['%', -10, 3], {})).toBe(-1);
  });

  test('handles chained modulo 100 % 30 % 7', () => {
    expect(evaluate(['%', 100, 30, 7], {})).toBe(3); // (100 % 30) % 7 = 10 % 7 = 3
  });

  test('throws on fewer than 2 arguments', () => {
    expect(() => evaluate(['%', 5], {})).toThrow('% requires at least 2 arguments');
  });

  test('throws on non-numeric arguments', () => {
    expect(() => evaluate(['%', 'hello', 3], {})).toThrow('Type error: % requires numeric arguments');
  });
});

// ============================================
// Math Functions: abs, min, max, floor, ceil, round
// ============================================

describe('abs', () => {
  test('returns absolute value of positive number', () => {
    expect(evaluate(['abs', 5], {})).toBe(5);
  });

  test('returns absolute value of negative number', () => {
    expect(evaluate(['abs', -5], {})).toBe(5);
  });

  test('returns 0 for 0', () => {
    expect(evaluate(['abs', 0], {})).toBe(0);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['abs', 1, 2], {})).toThrow('abs requires exactly one argument');
  });

  test('throws on non-numeric argument', () => {
    expect(() => evaluate(['abs', 'hello'], {})).toThrow('Type error: abs requires a numeric argument');
  });
});

describe('min', () => {
  test('finds minimum of two numbers', () => {
    expect(evaluate(['min', 3, 5], {})).toBe(3);
  });

  test('finds minimum of multiple numbers', () => {
    expect(evaluate(['min', 10, 3, 7, 1, 9], {})).toBe(1);
  });

  test('returns the value for single argument', () => {
    expect(evaluate(['min', 42], {})).toBe(42);
  });

  test('handles negative numbers', () => {
    expect(evaluate(['min', -5, -10, 3], {})).toBe(-10);
  });

  test('throws on no arguments', () => {
    expect(() => evaluate(['min'], {})).toThrow('min requires at least one argument');
  });

  test('throws on non-numeric arguments', () => {
    expect(() => evaluate(['min', 1, 'two'], {})).toThrow('Type error: min requires numeric arguments');
  });
});

describe('max', () => {
  test('finds maximum of two numbers', () => {
    expect(evaluate(['max', 3, 5], {})).toBe(5);
  });

  test('finds maximum of multiple numbers', () => {
    expect(evaluate(['max', 10, 3, 7, 1, 9], {})).toBe(10);
  });

  test('returns the value for single argument', () => {
    expect(evaluate(['max', 42], {})).toBe(42);
  });

  test('handles negative numbers', () => {
    expect(evaluate(['max', -5, -10, -3], {})).toBe(-3);
  });

  test('throws on no arguments', () => {
    expect(() => evaluate(['max'], {})).toThrow('max requires at least one argument');
  });

  test('throws on non-numeric arguments', () => {
    expect(() => evaluate(['max', 1, 'two'], {})).toThrow('Type error: max requires numeric arguments');
  });
});

describe('floor', () => {
  test('floors positive decimal', () => {
    expect(evaluate(['floor', 3.7], {})).toBe(3);
  });

  test('floors negative decimal', () => {
    expect(evaluate(['floor', -3.2], {})).toBe(-4);
  });

  test('returns integer unchanged', () => {
    expect(evaluate(['floor', 5], {})).toBe(5);
  });

  test('handles zero', () => {
    expect(evaluate(['floor', 0], {})).toBe(0);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['floor', 1, 2], {})).toThrow('floor requires exactly one argument');
  });

  test('throws on non-numeric argument', () => {
    expect(() => evaluate(['floor', 'hello'], {})).toThrow('Type error: floor requires a numeric argument');
  });
});

describe('ceil', () => {
  test('ceils positive decimal', () => {
    expect(evaluate(['ceil', 3.2], {})).toBe(4);
  });

  test('ceils negative decimal', () => {
    expect(evaluate(['ceil', -3.7], {})).toBe(-3);
  });

  test('returns integer unchanged', () => {
    expect(evaluate(['ceil', 5], {})).toBe(5);
  });

  test('handles zero', () => {
    expect(evaluate(['ceil', 0], {})).toBe(0);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['ceil', 1, 2], {})).toThrow('ceil requires exactly one argument');
  });

  test('throws on non-numeric argument', () => {
    expect(() => evaluate(['ceil', 'hello'], {})).toThrow('Type error: ceil requires a numeric argument');
  });
});

describe('round', () => {
  test('rounds down when decimal < 0.5', () => {
    expect(evaluate(['round', 3.2], {})).toBe(3);
  });

  test('rounds up when decimal >= 0.5', () => {
    expect(evaluate(['round', 3.7], {})).toBe(4);
  });

  test('rounds 0.5 up', () => {
    expect(evaluate(['round', 3.5], {})).toBe(4);
  });

  test('handles negative numbers', () => {
    expect(evaluate(['round', -3.5], {})).toBe(-3);
  });

  test('returns integer unchanged', () => {
    expect(evaluate(['round', 5], {})).toBe(5);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['round', 1, 2], {})).toThrow('round requires exactly one argument');
  });

  test('throws on non-numeric argument', () => {
    expect(() => evaluate(['round', 'hello'], {})).toThrow('Type error: round requires a numeric argument');
  });
});

// ============================================
// Type Predicates
// ============================================

describe('null?', () => {
  test('returns true for null', () => {
    // null is now self-evaluating in the interpreter
    expect(evaluate(['null?', null], {})).toBe(true);
  });

  test('returns false for 0', () => {
    expect(evaluate(['null?', 0], {})).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(evaluate(['null?', "''"], {})).toBe(false);
  });

  test('returns false for empty array', () => {
    expect(evaluate(['null?', ['quote', []]], {})).toBe(false);
  });

  test('returns false for false', () => {
    expect(evaluate(['null?', false], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['null?'], {})).toThrow('null? requires exactly one argument');
  });
});

describe('list?', () => {
  test('returns true for empty array', () => {
    expect(evaluate(['list?', ['quote', []]], {})).toBe(true);
  });

  test('returns true for array with elements', () => {
    expect(evaluate(['list?', ['quote', [1, 2, 3]]], {})).toBe(true);
  });

  test('returns false for number', () => {
    expect(evaluate(['list?', 42], {})).toBe(false);
  });

  test('returns false for string', () => {
    expect(evaluate(['list?', "'hello"], {})).toBe(false);
  });

  test('returns false for boolean', () => {
    expect(evaluate(['list?', true], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['list?'], {})).toThrow('list? requires exactly one argument');
  });
});

describe('number?', () => {
  test('returns true for integer', () => {
    expect(evaluate(['number?', 42], {})).toBe(true);
  });

  test('returns true for float', () => {
    expect(evaluate(['number?', 3.14], {})).toBe(true);
  });

  test('returns true for negative number', () => {
    expect(evaluate(['number?', -5], {})).toBe(true);
  });

  test('returns true for zero', () => {
    expect(evaluate(['number?', 0], {})).toBe(true);
  });

  test('returns false for string', () => {
    expect(evaluate(['number?', "'42"], {})).toBe(false);
  });

  test('returns false for boolean', () => {
    expect(evaluate(['number?', true], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['number?', 1, 2], {})).toThrow('number? requires exactly one argument');
  });
});

describe('string?', () => {
  test('returns true for quoted string', () => {
    expect(evaluate(['string?', "'hello"], {})).toBe(true);
  });

  test('returns true for empty string', () => {
    expect(evaluate(['string?', "''"], {})).toBe(true);
  });

  test('returns false for number', () => {
    expect(evaluate(['string?', 42], {})).toBe(false);
  });

  test('returns false for boolean', () => {
    expect(evaluate(['string?', true], {})).toBe(false);
  });

  test('returns false for array', () => {
    expect(evaluate(['string?', ['quote', []]], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['string?', 'a', 'b'], {})).toThrow('string? requires exactly one argument');
  });
});

describe('boolean?', () => {
  test('returns true for true', () => {
    expect(evaluate(['boolean?', true], {})).toBe(true);
  });

  test('returns true for false', () => {
    expect(evaluate(['boolean?', false], {})).toBe(true);
  });

  test('returns false for 1', () => {
    expect(evaluate(['boolean?', 1], {})).toBe(false);
  });

  test('returns false for 0', () => {
    expect(evaluate(['boolean?', 0], {})).toBe(false);
  });

  test('returns false for string', () => {
    expect(evaluate(['boolean?', "'true"], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['boolean?', true, false], {})).toThrow('boolean? requires exactly one argument');
  });
});

describe('object?', () => {
  test('returns true for plain object (via env)', () => {
    // Objects can be passed through the environment
    expect(evaluate(['object?', 'myObj'], { myObj: { a: 1 } })).toBe(true);
  });

  test('returns true for empty object (via env)', () => {
    expect(evaluate(['object?', 'myObj'], { myObj: {} })).toBe(true);
  });

  test('returns false for array', () => {
    expect(evaluate(['object?', ['quote', [1, 2]]], {})).toBe(false);
  });

  test('returns false for null', () => {
    expect(evaluate(['object?', null], {})).toBe(false);
  });

  test('returns false for number', () => {
    expect(evaluate(['object?', 42], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['object?'], {})).toThrow('object? requires exactly one argument');
  });
});

describe('function?', () => {
  test('returns true for lambda (via env)', () => {
    // Create lambda and pass through environment
    const lambda = evaluate(['λ', ['x'], ['+', 'x', 1]], {});
    expect(evaluate(['function?', 'fn'], { fn: lambda })).toBe(true);
  });

  test('returns true for defined lambda', () => {
    // Use let to create a function and test it
    const result = evaluate(
      ['let', [['fn', ['λ', ['x'], 'x']]], ['function?', 'fn']],
      {}
    );
    expect(result).toBe(true);
  });

  test('returns false for number', () => {
    expect(evaluate(['function?', 42], {})).toBe(false);
  });

  test('returns false for string', () => {
    expect(evaluate(['function?', "'hello"], {})).toBe(false);
  });

  test('returns false for array', () => {
    expect(evaluate(['function?', ['quote', [1, 2]]], {})).toBe(false);
  });

  test('throws on wrong number of arguments', () => {
    expect(() => evaluate(['function?'], {})).toThrow('function? requires exactly one argument');
  });
});

// ============================================
// Integration Tests
// ============================================

describe('operators integration', () => {
  test('uses >= in conditional', () => {
    const result = evaluate(
      ['if', ['>=', 18, 18], "'adult", "'minor"],
      {}
    );
    expect(result).toBe('adult');
  });

  test('uses % for even/odd check', () => {
    const isEven = evaluate(
      ['eq?', ['%', 10, 2], 0],
      {}
    );
    expect(isEven).toBe(true);
  });

  test('combines min/max for clamping', () => {
    // clamp(value, min, max) = max(min, min(value, max))
    const clamp = evaluate(
      ['max', 0, ['min', 150, 100]], // clamp 150 to [0, 100]
      {}
    );
    expect(clamp).toBe(100);
  });

  test('uses floor for integer division', () => {
    const intDiv = evaluate(['floor', ['/', 17, 5]], {});
    expect(intDiv).toBe(3);
  });

  test('type checking in conditional', () => {
    const result = evaluate(
      ['if', ['number?', 42], "'is-number", "'not-number"],
      {}
    );
    expect(result).toBe('is-number');
  });
});

