# λ.json Use Cases & Practical Applications

## Overview

λ.json is a Turing-complete, homoiconic subset of JSON that enables executable code within JSON documents. This makes it uniquely suited for scenarios where you need both data and logic in a single, portable format.

## Real-World Applications

### 1. 🔧 Configuration Files with Business Logic

**Problem:** Traditional JSON config files are static and require external code to interpret rules.

**Solution:** Embed validation and transformation logic directly in the config.

```json
{
  "pricing": {
    "rules": [
      "define", "calculate-price",
      ["λ", ["qty", "base"],
        ["cond",
          [[">", "qty", 100], ["*", "base", "qty", 0.8]],
          [[">", "qty", 50], ["*", "base", "qty", 0.9]],
          ["else", ["*", "base", "qty"]]
        ]
      ]
    ]
  }
}
```

**Benefits:**
- Self-contained configuration
- No external business logic files needed
- Version control friendly
- Easy to test and validate

### 2. 📊 Data Transformation Pipelines

**Problem:** ETL processes often require separate transformation scripts.

**Solution:** Define transformations inline with data.

```json
{
  "data": [120, 150, 180, 145, 200],
  "transformations": {
    "average": ["λ", ["nums"], 
      ["/", 
        ["reduce", ["λ", ["acc", "n"], ["+", "acc", "n"]], "nums"],
        ["length", "nums"]
      ]
    ],
    "normalize": ["λ", ["nums", "max"],
      ["map", ["λ", ["n"], ["/", "n", "max"]], "nums"]
    ]
  }
}
```

**Use Cases:**
- API response transformation
- Data normalization
- Statistical analysis
- Report generation

### 3. 🎯 Business Rule Engines

**Problem:** Business rules change frequently and require code deployments. In financial services, investment firms, and trading platforms, rules for fees, taxes, compliance, and risk management need to be updated rapidly without downtime.

**Solution:** Store rules as λ.json that can be updated without code changes. Rules are loaded dynamically from JSON files, enabling hot-reload, version control, and environment-specific configurations.

#### Simple Example: Loan Eligibility
```json
{
  "eligibility_rules": [
    "define", "is-eligible",
    ["λ", ["age", "income", "credit-score"],
      ["and",
        [">", "age", 18],
        [">", "income", 30000],
        [">", "credit-score", 650]
      ]
    ]
  ]
}
```

#### Complex Example: Investment Asset Management System

A complete investment accounting system with **19+ business rules** covering transaction processing, tax calculations, risk management, portfolio analytics, and compliance. See the full implementation in `examples/investment-accounting.json`.

**Real-World Results from Demo:**
- ✅ Buy 100 shares @ $150.50 = $15,065.05 (including $15.05 gold-tier fee)
- ✅ Sell 50 shares @ $175 = $969.50 net gain after 20% long-term capital gains tax
- ✅ Dividend $50 → 0.2796 new shares reinvested (DRIP)
- ✅ Stop loss triggers at $138 when price drops to $135 (10% loss detected)
- ✅ Compliance checks: PDT detection, concentration limits, trading halts

**System Capabilities:**

1. **Transaction Processing** - Tiered fee structures, buy/sell processing, DRIP, cost basis tracking
2. **Tax Calculations** - Short/long-term capital gains (37%/20%), qualified dividends, wash sales
3. **Risk Management** - Stop losses, position sizing, portfolio risk scoring, margin requirements
4. **Portfolio Analytics** - Returns calculation, rebalancing analysis, position weighting, unrealized P&L
5. **Compliance & Regulatory** - Pattern day trader detection, concentration limits, trading halt checks

**Benefits:**
- ✅ **Hot-reload business rules** - Update fees, tax rates, limits without deployment
- ✅ **Non-developers can update rules** - Business analysts modify JSON directly
- ✅ **Audit trail in version control** - Every rule change tracked in git with full history
- ✅ **A/B testing different rule sets** - Test new fee structures with specific user segments
- ✅ **Environment-specific rules** - Different rules for dev/staging/production environments
- ✅ **Instant rollback** - Revert to previous rule version immediately if issues arise
- ✅ **Zero downtime updates** - Rules reload without service restart or deployment
- ✅ **Regulatory compliance** - Document and audit all rule changes for regulators

**Real-World Use Cases:**
- Investment platforms (Robinhood, E*TRADE, Fidelity)
- Robo-advisors (Betterment, Wealthfront)
- Trading systems (algorithmic trading, market making)
- Banking (loan processing, credit decisions)
- Insurance (underwriting, claims processing)
- E-commerce (pricing, promotions, discounts)
- SaaS platforms (billing, usage limits, feature flags)

**Try it yourself:**
```bash
node examples/test-investment-accounting.js
```

This demonstrates how λ.json enables sophisticated business logic to be managed as configuration rather than code, dramatically improving agility and reducing deployment risk.

### 4. 🧮 Mathematical & Scientific Computing

**Problem:** Need portable mathematical functions without dependencies.

**Solution:** Define algorithms in pure λ.json.

**Examples:**
- **Prime number detection** (cryptography basics)
- **Factorial calculations** (combinatorics)
- **Compound interest** (financial modeling)
- **Statistical functions** (data analysis)

```json
{
  "algorithms": {
    "factorial": ["define", "fact",
      ["λ", ["n"],
        ["cond",
          [["eq?", "n", 0], 1],
          ["else", ["*", "n", ["fact", ["-", "n", 1]]]]
        ]
      ]
    ]
  }
}
```

### 5. 🎓 Educational Tools

**Problem:** Teaching functional programming concepts requires setup.

**Solution:** λ.json runs in any JavaScript environment with zero dependencies.

**Perfect for teaching:**
- Lambda calculus
- Recursion
- Higher-order functions
- Lazy evaluation
- Stream processing
- Functional composition

### 6. 🔌 API Response Processing

**Problem:** APIs return data that needs client-side transformation.

**Solution:** Include transformation logic in API responses.

```json
{
  "data": [
    {"name": "Product A", "price": 100, "qty": 5},
    {"name": "Product B", "price": 50, "qty": 10}
  ],
  "compute": {
    "total": ["reduce", 
      ["λ", ["acc", "item"], ["+", "acc", ["*", "price", "qty"]]],
      "data"
    ]
  }
}
```

### 7. 📝 Domain-Specific Languages (DSLs)

**Problem:** Need a custom language for specific domains.

**Solution:** Build DSLs on top of λ.json.

**Examples:**
- Query languages
- Workflow definitions
- Form validation rules
- Access control policies

```json
{
  "workflow": [
    "define", "process-order",
    ["λ", ["order"],
      ["cond",
        [["<", ["get", "order", "total"], 100], "auto-approve"],
        [["<", ["get", "order", "total"], 1000], "manager-review"],
        ["else", "director-review"]
      ]
    ]
  ]
}
```

### 8. 🧪 Prototyping & Experimentation

**Problem:** Testing algorithms requires full development setup.

**Solution:** Rapid prototyping in λ.json REPL.

**Benefits:**
- Instant feedback
- No compilation
- Easy to share
- Platform independent

### 9. 🔄 Stream Processing

**Problem:** Processing large datasets requires memory-efficient solutions.

**Solution:** Use λ.json's lazy stream evaluation.

```json
{
  "infinite_sequences": {
    "fibonacci": ["define", "fibs",
      ["λ", ["a", "b"],
        ["cons-stream", "a", ["fibs", "b", ["+", "a", "b"]]]
      ]
    ],
    "primes": ["filter-stream",
      ["λ", ["n"], ["is-prime", "n"]],
      ["enum-stream", 1000000]
    ]
  }
}
```

**Applications:**
- Log processing
- Time series analysis
- Event stream processing
- Real-time data pipelines

### 10. 🎮 Game Logic & AI

**Problem:** Game rules need to be data-driven and moddable.

**Solution:** Define game logic in λ.json for easy modification.

```json
{
  "damage_calculation": [
    "define", "calc-damage",
    ["λ", ["base", "level", "multiplier"],
      ["*", "base", ["+", 1, ["*", "level", 0.1]], "multiplier"]
    ]
  ],
  "ai_decision": [
    "define", "should-attack",
    ["λ", ["health", "enemy-health", "distance"],
      ["and",
        [">", "health", 30],
        ["<", "enemy-health", 50],
        ["<", "distance", 10]
      ]
    ]
  ]
}
```

## Comparison with Alternatives

| Feature | λ.json | JavaScript | Python | SQL |
|---------|--------|------------|--------|-----|
| Pure JSON | ✅ | ❌ | ❌ | ❌ |
| Homoiconic | ✅ | ❌ | ❌ | ❌ |
| Functional | ✅ | Partial | Partial | ❌ |
| Lazy Evaluation | ✅ | ❌ | Partial | ✅ |
| Zero Dependencies | ✅ | ❌ | ❌ | ❌ |
| Portable | ✅ | ❌ | ❌ | ❌ |
| Turing Complete | ✅ | ✅ | ✅ | ❌ |

## When to Use λ.json

### ✅ Good Fit

- Configuration files with logic
- Data + transformation in one file
- Educational/teaching tools
- Prototyping algorithms
- Business rule engines
- API response processing
- Mathematical computations
- Stream processing

### ⚠️ Consider Alternatives

- Performance-critical applications (use compiled languages)
- Complex object manipulation (use JavaScript/Python)
- Large-scale systems (use established languages)
- Team unfamiliar with functional programming
- Need extensive standard library

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Arithmetic | O(1) | Direct operations |
| List operations | O(n) | Map, filter, reduce |
| Recursion | O(n) stack | No tail-call optimization |
| Streams | O(1) per item | Lazy evaluation |
| Function calls | O(1) | Closure creation |

## Security Considerations

### ✅ Safe

- Pure functional (no side effects)
- No file system access
- No network access
- No eval() in runtime
- Sandboxed execution

### ⚠️ Be Aware

- Infinite recursion possible
- Stack overflow on deep recursion
- CPU-intensive computations
- Memory usage with large data

**Recommendation:** Use resource limits and timeouts when executing untrusted λ.json code.

## Integration Examples

### Node.js

```javascript
const { evaluate, globalEnv } = require('./λJSON.js');

const config = require('./config.json');
const result = evaluate(config.logic, globalEnv);
```

### Web Browser

```html
<script src="λJSON.js"></script>
<script>
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      const result = evaluate(data.code, globalEnv);
      console.log(result);
    });
</script>
```

### REST API

```javascript
app.post('/execute', (req, res) => {
  try {
    const result = evaluate(req.body.code, globalEnv);
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
```

## Future Possibilities

1. **λ.json Compiler** - Compile to JavaScript for better performance
2. **Type System** - Optional static typing
3. **Standard Library** - Common utilities as λ.json modules
4. **IDE Support** - Syntax highlighting and autocomplete
5. **Debugger** - Step-through execution
6. **Package Manager** - Share and reuse λ.json modules
7. **Optimization** - Tail-call optimization, memoization

## Conclusion

λ.json fills a unique niche: executable logic within JSON documents. It's particularly valuable when you need:

- **Portability** - Works anywhere JSON works
- **Simplicity** - No build tools or dependencies
- **Transparency** - Code and data in one readable format
- **Flexibility** - Turing-complete functional programming

While not suitable for all use cases, λ.json excels in configuration management, data transformation, business rules, and educational contexts where its unique properties provide clear advantages over traditional approaches.

## Learn More

- See `examples/practical-programs.js` for working examples
- See `examples/fibonacci.json` for algorithm implementations
- See `examples/README.md` for language features
- Run `npm run cli` to try the REPL

---

**Remember:** λ.json is about bringing the power of functional programming to JSON, making data and logic truly portable and self-contained.
