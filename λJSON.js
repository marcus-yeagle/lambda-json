// Define the global environment with basic arithmetic functions, comparators, and the 'not' special form
const globalEnv = {
  '+': (args) => {
    if (
      args.every((a) => typeof a === 'number') ||
      args.every((a) => typeof a === 'string')
    ) {
      return args.reduce((acc, val) => acc + val);
    } else {
      // Calling '+' on some unevaluated expression, general case
      const evaluatedArgs = args.map((arg) => {
        if (typeof arg === 'string' || Array.isArray(arg)) {
          return evaluate(arg, globalEnv);
        } else {
          return arg;
        }
      });
    }
  },
  '-': (args) => {
    if (args.every((a) => typeof a === 'number')) {
      return args.reduce((acc, val) => acc - val);
    } else {
      const evaluatedArgs = args.map((arg) => {
        if (typeof arg === 'string' || Array.isArray(arg)) {
          return evaluate(arg, globalEnv);
        } else {
          return arg;
        }
      });
    }
  },
  '*': (args) => {
    if (args.every((a) => typeof a === 'number')) {
      return args.reduce((acc, val) => acc * val);
    } else {
      const evaluatedArgs = args.map((arg) => {
        if (typeof arg === 'string' || Array.isArray(arg)) {
          return evaluate(arg, env);
        } else {
          return arg;
        }
      });
    }
  },
  '/': (args) => args.reduce((acc, val) => acc / val),
  '>': (args) =>
    args.every((val, index) => index === 0 || args[index - 1] > val), // Greater than comparator
  '<': (args) =>
    args.every((val, index) => index === 0 || args[index - 1] < val), // Less than comparator
  not: (args) => !evaluate(args[0], {}), // 'not' special form
};

const primMathOps = ['+', '-', '*', '/'];

//
// TODO: ['square'] - breaks
// TODO: fix:
// λ-JSON -> []
//
// Evaluate an expression in the given environment
function evaluate(exp, env) {
  if (typeof exp === 'number') {
    return exp; // Numbers evaluate to themselves
  } else if (typeof exp === 'string') {
    if (exp.startsWith("'")) {
      return exp.substring(1); // Remove the quote symbol and treat it as a literal string
    }
    if (env[exp] !== undefined) {
      return env[exp]; // Variable lookup in the environment
    } else {
      return exp;
    }
  } else if (Array.isArray(exp)) {
    const [operator, ...args] = exp;
    if (operator === 'define') {
      const [variable, value] = args;
      globalEnv[variable] = evaluate(value, env);
      return globalEnv[variable];
    } else if (operator === 'lambda' || operator === 'λ') {
      const [parameters, body] = args;
      return (...evalArgs) => {
        const localEnv = { ...env, ...globalEnv };
        // Copy glb env into local env and eval args wrt formal params
        parameters.forEach((param, index) => {
          localEnv[param] = evalArgs[index];
        });
        return evaluate(body, localEnv);
      };
    } else if (operator === 'if') {
      const [condition, trueBranch, falseBranch] = args;
      const conditionResult = evaluate(condition, env);
      return conditionResult
        ? evaluate(trueBranch, env)
        : evaluate(falseBranch, env);
    } else if (operator === 'cond') {
      for (const [condition, expr] of args) {
        if (evaluate(condition, env)) {
          return evaluate(expr, env);
        }
      }
      const [condition, expr] = args[args.length - 1]; // enforce last else
      if (condition === 'else') {
        return evaluate(expr, env);
      }
    } else if (operator === 'map') {
      const [proc, list] = args;
      return evaluate(list, env).map((l) => evaluate(proc, env)(l));
    } else if (operator === 'filter') {
      const [proc, list] = args;
      return evaluate(list, env).filter((l) => evaluate(proc, env)(l));
    } else if (operator === 'reduce') {
      const [proc, list] = args;
      return evaluate(list, env).reduce(evaluate(proc, env));
    } else if (operator === 'let') {
      const [bindings, body] = args;
      const localEnv = { ...env };
      bindings.forEach(([variable, value]) => {
        localEnv[variable] = evaluate(evaluate(value, env), localEnv);
      });
      return evaluate(body, localEnv);
    } else if (operator === 'let*') {
      const [bindings, body] = args;
      const localEnv = { ...env };
      bindings.forEach(([variable, value]) => {
        localEnv[variable] = evaluate(value, localEnv);
      });
      return evaluate(body, localEnv);
    } else if (operator === 'quote') {
      return args[0]; // Return the unevaluated value as a literal
    } else if (operator === 'eq?') {
      const [arg1, arg2] = args;
      const value1 = evaluate(arg1, env);
      const value2 = evaluate(arg2, env);
      return value1 === value2;
    } else if (operator === 'divides?') {
      const x = evaluate(args[0], env);
      const y = evaluate(args[1], env);
      return y % x === 0;
    } else if (operator === 'length') {
      const list = evaluate(args[0], env);
      return list.length;
    } else if (operator === 'cons-stream') {
      const headValue = evaluate(args[0], env);
      const tailThunk = evaluate(args[1], env);
      return [
        headValue,
        function* () {
          const tailStream = tailThunk();
          for (const value of tailStream) {
            yield value;
          }
        },
      ];
      // const headValue = evaluate(args[0], env);
      // const tailThunk = evaluate(args[1], env);
      // return function* () {
      //   yield headValue;
      //   const tailStream = tailThunk();
      //   for (const value of tailStream) {
      //     yield value;
      //   }
      // };
    } else if (operator === 'delay') {
      return function* () {
        for (const arg of args[0]) {
          yield evaluate(arg, env);
        }
      };
    } else if (operator === 'head') {
      const stream = evaluate(args[0], env)();
      return stream[0];
    } else if (operator === 'tail') {
      const stream = evaluate(args[0], env)();
      stream.next(); // Skip the first value
      return function* () {
        for (const value of stream) {
          yield value;
        }
      };
    } else if (operator === 'force') {
      const forced = evaluate(args[0], env);
      if (typeof forced === 'function') {
        const generator = forced();
        return Array.from(generator);
      } else {
        return forced;
      }
    } else if (operator === 'take') {
      let n = evaluate(args[0], env);
      const stream = evaluate(args[1], env);
      const result = [];
      const gen = stream[1]();

      while (n !== 0) {
        result.push(gen.next().value);
        --n;
      }
      return result;
    } else if (operator === 'enum-stream') {
      const n = evaluate(args[0], env);

      return function* () {
        for (let i = 1; i <= n; i++) {
          yield i;
        }
      };
    } else if (operator === 'map-stream') {
      const fn = evaluate(args[0], env);
      const stream = evaluate(args[1], env);
      return function* () {
        for (const item of stream()) {
          yield fn(item);
        }
      };
    } else if (operator === 'filter-stream') {
      const predicate = evaluate(args[0], env);
      const stream = evaluate(args[1], env);
      return function* () {
        for (const item of stream()) {
          if (predicate(item)) {
            yield item;
          }
        }
      };
    } else {
      const evaluatedOperator = evaluate(operator, env);
      const evaluatedArgs = args.map((arg) => {
        if (typeof arg === 'string' || Array.isArray(arg)) {
          return evaluate(arg, env);
        } else {
          return arg;
        }
      });

      // Apply
      if (typeof evaluatedOperator === 'function') {
        // Pass args in as JS Array for primative reduce [a1, a2]
        // Otherwise pass the evaluated args to function normally (a1, a2)
        return primMathOps.includes(evaluatedOperator.name)
          ? evaluatedOperator(evaluatedArgs)
          : evaluatedOperator(...evaluatedArgs);
      } else {
        return exp; // Return the unevaluated expression as a special form
      }
    }
  }
}

module.exports = { globalEnv, evaluate };
