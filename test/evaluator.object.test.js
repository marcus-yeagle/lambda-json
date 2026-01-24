const { evaluate } = require('../λjson.js');

// ============================================
// Object Self-Evaluation
// ============================================

describe('object self-evaluation', () => {
  test('empty object evaluates to itself', () => {
    const result = evaluate({}, {});
    expect(result).toEqual({});
  });

  test('object with properties evaluates to itself', () => {
    const obj = { name: 'Alice', age: 30 };
    const result = evaluate(obj, {});
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  test('nested objects evaluate correctly', () => {
    const obj = { user: { name: 'Bob', details: { age: 25 } } };
    const result = evaluate(obj, {});
    expect(result).toEqual({ user: { name: 'Bob', details: { age: 25 } } });
  });
});

// ============================================
// get
// ============================================

describe('get', () => {
  test('gets existing key from object', () => {
    const result = evaluate(['get', { name: 'Alice' }, ['quote', 'name']], {});
    expect(result).toBe('Alice');
  });

  test('returns null for non-existent key', () => {
    const result = evaluate(['get', { name: 'Alice' }, ['quote', 'age']], {});
    expect(result).toBe(null);
  });

  test('gets nested value', () => {
    const result = evaluate(
      ['get', ['get', { user: { name: 'Bob' } }, ['quote', 'user']], ['quote', 'name']],
      {}
    );
    expect(result).toBe('Bob');
  });

  test('works with object in environment', () => {
    const result = evaluate(['get', 'obj', ['quote', 'x']], { obj: { x: 42 } });
    expect(result).toBe(42);
  });

  test('throws on non-object first argument', () => {
    expect(() => evaluate(['get', 42, ['quote', 'x']], {}))
      .toThrow('get requires an object as first argument');
  });

  test('throws on non-string key', () => {
    expect(() => evaluate(['get', { a: 1 }, 42], {}))
      .toThrow('get requires a string key as second argument');
  });
});

// ============================================
// keys
// ============================================

describe('keys', () => {
  test('returns empty array for empty object', () => {
    const result = evaluate(['keys', {}], {});
    expect(result).toEqual([]);
  });

  test('returns all keys', () => {
    const result = evaluate(['keys', { a: 1, b: 2, c: 3 }], {});
    expect(result.sort()).toEqual(['a', 'b', 'c']);
  });

  test('throws on non-object', () => {
    expect(() => evaluate(['keys', [1, 2, 3]], {}))
      .toThrow('keys requires an object argument');
  });

  test('throws on null', () => {
    expect(() => evaluate(['keys', null], {}))
      .toThrow('keys requires an object argument');
  });
});

// ============================================
// values
// ============================================

describe('values', () => {
  test('returns empty array for empty object', () => {
    const result = evaluate(['values', {}], {});
    expect(result).toEqual([]);
  });

  test('returns all values', () => {
    const result = evaluate(['values', { a: 1, b: 2, c: 3 }], {});
    expect(result.sort()).toEqual([1, 2, 3]);
  });

  test('throws on non-object', () => {
    expect(() => evaluate(['values', [1, 2, 3]], {}))
      .toThrow('values requires an object argument');
  });
});

// ============================================
// assoc
// ============================================

describe('assoc', () => {
  test('adds new key to object', () => {
    const result = evaluate(['assoc', { a: 1 }, ['quote', 'b'], 2], {});
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('updates existing key', () => {
    const result = evaluate(['assoc', { a: 1 }, ['quote', 'a'], 99], {});
    expect(result).toEqual({ a: 99 });
  });

  test('returns new object (immutable)', () => {
    const original = { a: 1 };
    const result = evaluate(['assoc', original, ['quote', 'b'], 2], {});
    expect(result).toEqual({ a: 1, b: 2 });
    expect(original).toEqual({ a: 1 }); // Original unchanged
  });

  test('throws on non-object', () => {
    expect(() => evaluate(['assoc', [1, 2], ['quote', 'x'], 1], {}))
      .toThrow('assoc requires an object as first argument');
  });

  test('throws on non-string key', () => {
    expect(() => evaluate(['assoc', {}, 123, 1], {}))
      .toThrow('assoc requires a string key as second argument');
  });
});

// ============================================
// dissoc
// ============================================

describe('dissoc', () => {
  test('removes key from object', () => {
    const result = evaluate(['dissoc', { a: 1, b: 2 }, ['quote', 'a']], {});
    expect(result).toEqual({ b: 2 });
  });

  test('returns same content if key not present', () => {
    const result = evaluate(['dissoc', { a: 1 }, ['quote', 'x']], {});
    expect(result).toEqual({ a: 1 });
  });

  test('returns new object (immutable)', () => {
    const original = { a: 1, b: 2 };
    const result = evaluate(['dissoc', original, ['quote', 'a']], {});
    expect(result).toEqual({ b: 2 });
    expect(original).toEqual({ a: 1, b: 2 }); // Original unchanged
  });

  test('throws on non-object', () => {
    expect(() => evaluate(['dissoc', [1, 2], ['quote', 'x']], {}))
      .toThrow('dissoc requires an object as first argument');
  });
});

// ============================================
// merge
// ============================================

describe('merge', () => {
  test('merges two objects', () => {
    const result = evaluate(['merge', { a: 1 }, { b: 2 }], {});
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('later objects override earlier', () => {
    const result = evaluate(['merge', { a: 1, b: 2 }, { b: 99 }], {});
    expect(result).toEqual({ a: 1, b: 99 });
  });

  test('merges multiple objects', () => {
    const result = evaluate(['merge', { a: 1 }, { b: 2 }, { c: 3 }], {});
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('returns empty object with no arguments', () => {
    const result = evaluate(['merge'], {});
    expect(result).toEqual({});
  });

  test('returns new object (immutable)', () => {
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const result = evaluate(['merge', obj1, obj2], {});
    expect(obj1).toEqual({ a: 1 }); // Original unchanged
    expect(obj2).toEqual({ b: 2 }); // Original unchanged
  });

  test('throws if any argument is not an object', () => {
    expect(() => evaluate(['merge', { a: 1 }, [1, 2]], {}))
      .toThrow('merge requires all arguments to be objects');
  });
});

// ============================================
// has-key?
// ============================================

describe('has-key?', () => {
  test('returns true for existing key', () => {
    const result = evaluate(['has-key?', { a: 1 }, ['quote', 'a']], {});
    expect(result).toBe(true);
  });

  test('returns false for non-existent key', () => {
    const result = evaluate(['has-key?', { a: 1 }, ['quote', 'b']], {});
    expect(result).toBe(false);
  });

  test('returns true even if value is null', () => {
    const result = evaluate(['has-key?', { a: null }, ['quote', 'a']], {});
    expect(result).toBe(true);
  });

  test('returns true even if value is undefined', () => {
    const result = evaluate(['has-key?', { a: undefined }, ['quote', 'a']], {});
    expect(result).toBe(true);
  });

  test('throws on non-object', () => {
    expect(() => evaluate(['has-key?', [1, 2], ['quote', 'x']], {}))
      .toThrow('has-key? requires an object as first argument');
  });
});

// ============================================
// Integration Tests
// ============================================

describe('object operations integration', () => {
  test('build object from pairs', () => {
    // Create an object and add keys incrementally
    const result = evaluate(
      ['assoc', ['assoc', {}, ['quote', 'x'], 10], ['quote', 'y'], 20],
      {}
    );
    expect(result).toEqual({ x: 10, y: 20 });
  });

  test('conditionally get value', () => {
    const result = evaluate(
      ['if', 
        ['has-key?', { name: 'Alice' }, ['quote', 'name']],
        ['get', { name: 'Alice' }, ['quote', 'name']],
        ['quote', 'unknown']
      ],
      {}
    );
    expect(result).toBe('Alice');
  });

  test('transform object values with map', () => {
    // Double all values in an object
    const result = evaluate(
      ['map', ['λ', ['v'], ['*', 'v', 2]], ['values', { a: 1, b: 2, c: 3 }]],
      {}
    );
    expect(result.sort()).toEqual([2, 4, 6]);
  });

  test('count object keys', () => {
    // Count number of keys in an object
    const result = evaluate(
      ['length', ['keys', { a: 1, b: 2, c: 3 }]],
      {}
    );
    expect(result).toBe(3);
  });
});

