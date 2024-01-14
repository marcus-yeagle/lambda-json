const { evaluate, globalEnv } = require('./λjson.js');
const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
if (process.argv.includes('-repl')) {
  // Reader
  readline.setPrompt('λ.json -> ');
  readline.prompt();
  readline
    .on('line', function (λexpression) {
      if (['quit', 'q', 'exit'].includes(λexpression)) readline.close();
      // Evaluator
      // Printer
      console.log();
      try {
        console.log(`${evaluate(eval(λexpression), globalEnv)}!`);
      } catch (e) {
        console.error(e);
      }
      console.log();
      readline.prompt();
      // Loop
    })
    .on('close', function () {
      process.exit(0);
    });
} else if (process.argv.includes('-f' || process.argv.includes('-file'))) {
  process.argv.forEach((arg) => {
    if (arg.includes('.json')) {
      const text = fs.readFileSync(arg, 'utf8');
      fs.writeFileSync(
        'result-' + arg,
        JSON.stringify({
          ...JSON.parse(text),
          result: evaluate(
            [JSON.parse(text)['code'], JSON.parse(text)['data']],
            globalEnv
          ),
        })
      );
    }
  });
  process.exit(0);
} else {
  process.exit(0);
}
