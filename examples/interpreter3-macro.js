// Define the global environment with basic arithmetic functions, comparators, and the 'not' special form
const globalEnv = {
  '+': (args) => args.reduce((acc, val) => acc + val),
  '-': (args) => args.reduce((acc, val) => acc - val),
  '*': (args) => args.reduce((acc, val) => acc * val),
  '/': (args) => args.reduce((acc, val) => acc / val),
  '>': (args) =>
    args.every((val, index) => index === 0 || args[index - 1] > val), // Greater than comparator
  '<': (args) =>
    args.every((val, index) => index === 0 || args[index - 1] < val), // Less than comparator
  not: (args) => !evaluate(args[0]), // 'not' special form

  // 'macro' special form: Define a macro
  macro: (args) => {
    const [name, params, body] = args;
    const macroFunction = (...evalArgs) => {
      const localEnv = { ...globalEnv };
      params.forEach((param, index) => {
        localEnv[param] = evalArgs[index];
      });
      return evaluate(body, localEnv);
    };
    globalEnv[name] = macroFunction;
    return name;
  },
};

// Helper function to create a new local environment
function createLocalEnv(params, args, env) {
  const localEnv = { ...env };
  params.forEach((param, index) => {
    localEnv[param] = evaluate(args[index], env);
  });
  return localEnv;
}

// Helper function to handle tail recursion for lambda expressions
function tailRecursiveEval(lambda, args, env) {
  const localEnv = createLocalEnv(lambda.params, args, lambda.env);
  return evaluate(lambda.body, localEnv);
}

// Evaluate an expression in the given environment
function evaluate(exp, env) {
  if (typeof exp === 'number') {
    return exp; // Numbers evaluate to themselves
  } else if (typeof exp === 'string') {
    if (exp.startsWith("'")) {
      return exp.substring(1); // Remove the quote symbol and treat it as a literal string
    }
    return env[exp]; // Variable lookup in the environment
  } else if (Array.isArray(exp)) {
    const [operator, ...args] = exp;
    if (operator === 'define') {
      const [variable, value] = args;
      env[variable] = evaluate(value, env);
      return env[variable];
    } else if (operator === 'lambda') {
      const [params, body] = args;
      return {
        type: 'lambda',
        params,
        body,
        env,
      };
    } else if (operator === 'if') {
      const [condition, trueBranch, falseBranch] = args;
      const conditionResult = evaluate(condition, env);
      if (conditionResult) {
        return evaluate(trueBranch, env);
      } else {
        return evaluate(falseBranch, env);
      }
    } else if (operator === 'cond') {
      for (const [condition, expr] of args) {
        const conditionResult = evaluate(condition, env);
        if (
          condition === 'else' ||
          (conditionResult === true && conditionResult !== false)
        ) {
          return evaluate(expr, env);
        }
      }
      return undefined; // If no conditions evaluate to true, return undefined
    } else if (operator === 'let') {
      const [bindings, body] = args;
      const localEnv = createLocalEnv(
        bindings.map(([variable]) => variable),
        bindings.map(([, value]) => value),
        env
      );
      return evaluate(body, localEnv);
    } else if (operator === 'quote') {
      return args[0]; // Return the unevaluated value as a literal
    } else if (operator === '=') {
      const [arg1, arg2] = args;
      const value1 = evaluate(arg1, env);
      const value2 = evaluate(arg2, env);
      return value1 === value2;
    } else {
      const opFunction = evaluate(operator, env);
      if (typeof opFunction === 'function') {
        const evaluatedArgs = args.map((arg) => evaluate(arg, env));
        return opFunction(evaluatedArgs);
      } else if (opFunction && opFunction.type === 'lambda') {
        return tailRecursiveEval(opFunction, args, env);
      } else {
        return exp; // Return the unevaluated expression as a special form
      }
    }
  }
}

// Lambda function to calculate the nth Fibonacci number
const fibonacci = [
  'lambda',
  ['n', 'a', 'b'],
  [
    'if',
    ['=', 'n', 0],
    'a',
    ['fibonacci', ['-', 'n', 1], 'b', ['+', 'a', 'b']],
  ],
];

// Evaluate the Fibonacci function expression and store it in the global environment
globalEnv['fibonacci'] = evaluate(fibonacci, globalEnv);

// Test case: Calculate the 10th Fibonacci number using the recursive Fibonacci function
const fibonacciOfTen = ['fibonacci', 10, 0, 1];

console.log(evaluate(fibonacciOfTen, globalEnv)); // Output: 55
