#!/usr/bin/env node

/**
 * Practical Real-World Programs in λ.json
 * Demonstrates useful applications beyond academic examples
 */

const { globalEnv, evaluate } = require('../λJSON.js');

console.log('='.repeat(70));
console.log('PRACTICAL λ.JSON PROGRAMS - Real-World Applications');
console.log('='.repeat(70));

// ============================================================================
// 1. DATA VALIDATION & TRANSFORMATION
// ============================================================================
console.log('\n📊 1. DATA VALIDATION & TRANSFORMATION');
console.log('-'.repeat(70));

// Validate and transform user data
const validateUser = [
  'define',
  'validate-user',
  [
    'λ',
    ['age', 'name'],
    [
      'cond',
      [['<', 'age', 0], "'Invalid: Age cannot be negative'"],
      [['>', 'age', 150], "'Invalid: Age too high'"],
      [['eq?', 'name', "''"], "'Invalid: Name required'"],
      ['else', "'Valid user'"],
    ],
  ],
];

evaluate(validateUser, globalEnv);
console.log('Validate user (25, "Alice"):', evaluate(['validate-user', 25, "'Alice"], globalEnv));
console.log('Validate user (-5, "Bob"):', evaluate(['validate-user', -5, "'Bob"], globalEnv));
console.log('Validate user (200, "Eve"):', evaluate(['validate-user', 200, "'Eve"], globalEnv));

// ============================================================================
// 2. STATISTICAL ANALYSIS
// ============================================================================
console.log('\n📈 2. STATISTICAL ANALYSIS');
console.log('-'.repeat(70));

// Calculate average
const average = [
  'define',
  'average',
  [
    'λ',
    ['nums'],
    [
      '/',
      ['reduce', ['λ', ['acc', 'n'], ['+', 'acc', 'n']], 'nums'],
      ['length', 'nums'],
    ],
  ],
];

evaluate(average, globalEnv);
const salesData = [120, 150, 180, 145, 200, 175, 190];
console.log('Sales data:', salesData);
console.log('Average sales:', evaluate(['average', salesData], globalEnv));

// Find maximum value
const maximum = [
  'define',
  'max',
  [
    'λ',
    ['nums'],
    [
      'reduce',
      ['λ', ['acc', 'n'], ['if', ['>', 'n', 'acc'], 'n', 'acc']],
      'nums',
    ],
  ],
];

evaluate(maximum, globalEnv);
console.log('Maximum sales:', evaluate(['max', salesData], globalEnv));

// Find minimum value
const minimum = [
  'define',
  'min',
  [
    'λ',
    ['nums'],
    [
      'reduce',
      ['λ', ['acc', 'n'], ['if', ['<', 'n', 'acc'], 'n', 'acc']],
      'nums',
    ],
  ],
];

evaluate(minimum, globalEnv);
console.log('Minimum sales:', evaluate(['min', salesData], globalEnv));

// ============================================================================
// 3. BUSINESS LOGIC - PRICING & DISCOUNTS
// ============================================================================
console.log('\n💰 3. PRICING & DISCOUNT CALCULATOR');
console.log('-'.repeat(70));

// Calculate price with tiered discounts
const calculatePrice = [
  'define',
  'calculate-price',
  [
    'λ',
    ['quantity', 'unit-price'],
    [
      'let',
      [
        ['subtotal', ['*', 'quantity', 'unit-price']],
        [
          'discount',
          [
            'cond',
            [['>', 'quantity', 100], 0.2],
            [['>', 'quantity', 50], 0.15],
            [['>', 'quantity', 20], 0.1],
            [['>', 'quantity', 10], 0.05],
            ['else', 0],
          ],
        ],
      ],
      ['*', 'subtotal', ['-', 1, 'discount']],
    ],
  ],
];

evaluate(calculatePrice, globalEnv);
console.log('Price for 5 items @ $10:', evaluate(['calculate-price', 5, 10], globalEnv));
console.log('Price for 15 items @ $10:', evaluate(['calculate-price', 15, 10], globalEnv));
console.log('Price for 60 items @ $10:', evaluate(['calculate-price', 60, 10], globalEnv));
console.log('Price for 150 items @ $10:', evaluate(['calculate-price', 150, 10], globalEnv));

// ============================================================================
// 4. DATA FILTERING & SEARCH
// ============================================================================
console.log('\n🔍 4. DATA FILTERING & SEARCH');
console.log('-'.repeat(70));

// Filter products by price range
const products = [
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 25 },
  { name: 'Keyboard', price: 75 },
  { name: 'Monitor', price: 350 },
  { name: 'Webcam', price: 89 },
];

// Note: This demonstrates the concept - actual implementation would need object support
console.log('Products:', products);
console.log('Filter by price range (50-400):');

const priceRange = [50, 400];
const filteredProducts = products.filter(
  (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
);
console.log('  Result:', filteredProducts.map((p) => `${p.name} ($${p.price})`));

// Using λ.json for numeric filtering
const prices = [999, 25, 75, 350, 89];
const filterRange = [
  'define',
  'in-range',
  [
    'λ',
    ['nums', 'min', 'max'],
    ['filter', ['λ', ['n'], ['and', ['>', 'n', 'min'], ['<', 'n', 'max']]], 'nums'],
  ],
];

evaluate(filterRange, globalEnv);
console.log('Prices in range 50-400:', evaluate(['in-range', prices, 50, 400], globalEnv));

// ============================================================================
// 5. SEQUENCE GENERATION - PAGINATION
// ============================================================================
console.log('\n📄 5. PAGINATION HELPER');
console.log('-'.repeat(70));

// Generate page numbers for pagination
const generatePages = [
  'define',
  'gen-pages',
  [
    'λ',
    ['total-items', 'per-page'],
    [
      'let',
      [
        ['total-pages', ['/', ['+', 'total-items', ['-', 'per-page', 1]], 'per-page']],
      ],
      'total-pages',
    ],
  ],
];

evaluate(generatePages, globalEnv);
console.log('Items: 247, Per page: 10');
console.log('Total pages:', Math.ceil(evaluate(['gen-pages', 247, 10], globalEnv)));

// ============================================================================
// 6. RECURSIVE DATA PROCESSING - FACTORIAL & COMBINATIONS
// ============================================================================
console.log('\n🔢 6. COMBINATORICS - Factorial & Permutations');
console.log('-'.repeat(70));

// Factorial (useful for combinations/permutations)
const factorial = [
  'define',
  'factorial',
  [
    'λ',
    ['n'],
    [
      'cond',
      [['eq?', 'n', 0], 1],
      [['eq?', 'n', 1], 1],
      ['else', ['*', 'n', ['factorial', ['-', 'n', 1]]]],
    ],
  ],
];

evaluate(factorial, globalEnv);
console.log('5! (arrangements of 5 items):', evaluate(['factorial', 5], globalEnv));
console.log('10! (arrangements of 10 items):', evaluate(['factorial', 10], globalEnv));

// ============================================================================
// 7. PRIME NUMBER CHECKER (Useful for cryptography basics)
// ============================================================================
console.log('\n🔐 7. PRIME NUMBER CHECKER');
console.log('-'.repeat(70));

const isPrime = [
  'define',
  'is-prime',
  [
    'λ',
    ['n'],
    [
      'cond',
      [['<', 'n', 2], false],
      [['eq?', 'n', 2], true],
      [['divides?', 2, 'n'], false],
      [
        'else',
        [
          'let',
          [
            [
              'check-divisor',
              [
                'λ',
                ['d'],
                [
                  'cond',
                  [['>', ['*', 'd', 'd'], 'n'], true],
                  [['divides?', 'd', 'n'], false],
                  ['else', ['check-divisor', ['+', 'd', 2]]],
                ],
              ],
            ],
          ],
          ['check-divisor', 3],
        ],
      ],
    ],
  ],
];

evaluate(isPrime, globalEnv);
const testNumbers = [2, 3, 4, 17, 20, 23, 29, 30, 97];
console.log('Testing numbers:', testNumbers);
testNumbers.forEach((n) => {
  const result = evaluate(['is-prime', n], globalEnv);
  console.log(`  ${n}: ${result ? 'PRIME ✓' : 'not prime'}`);
});

// ============================================================================
// 8. COMPOUND INTEREST CALCULATOR
// ============================================================================
console.log('\n💵 8. COMPOUND INTEREST CALCULATOR');
console.log('-'.repeat(70));

const compoundInterest = [
  'define',
  'compound',
  [
    'λ',
    ['principal', 'rate', 'years'],
    [
      'cond',
      [['eq?', 'years', 0], 'principal'],
      [
        'else',
        ['compound', ['*', 'principal', ['+', 1, 'rate']], 'rate', ['-', 'years', 1]],
      ],
    ],
  ],
];

evaluate(compoundInterest, globalEnv);
console.log('Investment: $10,000 @ 5% for 10 years');
const result1 = evaluate(['compound', 10000, 0.05, 10], globalEnv);
console.log('Final amount:', '$' + Number(result1).toFixed(2));
console.log('Investment: $5,000 @ 7% for 20 years');
const result2 = evaluate(['compound', 5000, 0.07, 20], globalEnv);
console.log('Final amount:', '$' + Number(result2).toFixed(2));

// ============================================================================
// 9. GRADE CALCULATOR
// ============================================================================
console.log('\n🎓 9. GRADE CALCULATOR');
console.log('-'.repeat(70));

const calculateGrade = [
  'define',
  'grade',
  [
    'λ',
    ['score'],
    [
      'cond',
      [['>', 'score', 90], "'A'"],
      [['>', 'score', 80], "'B'"],
      [['>', 'score', 70], "'C'"],
      [['>', 'score', 60], "'D'"],
      ['else', "'F'"],
    ],
  ],
];

evaluate(calculateGrade, globalEnv);
const scores = [95, 87, 72, 65, 58];
console.log('Scores:', scores);
console.log(
  'Grades:',
  scores.map((s) => `${s}=${evaluate(['grade', s], globalEnv)}`).join(', ')
);

// ============================================================================
// 10. STREAM-BASED DATA PROCESSING (Infinite sequences)
// ============================================================================
console.log('\n♾️  10. INFINITE SEQUENCE PROCESSING');
console.log('-'.repeat(70));

// Generate prime numbers using streams
console.log('First 20 prime numbers:');
const primeNumbers = [];
for (let i = 2; primeNumbers.length < 20; i++) {
  if (evaluate(['is-prime', i], globalEnv)) {
    primeNumbers.push(i);
  }
}
console.log(primeNumbers);

// Powers of 2 stream
const powersOf2 = [
  'define',
  'powers-of-2',
  [
    'λ',
    ['n'],
    ['cons-stream', 'n', ['powers-of-2', ['*', 'n', 2]]],
  ],
];

evaluate(powersOf2, globalEnv);
evaluate(['define', 'pow2', ['powers-of-2', 1]], globalEnv);
console.log('\nFirst 15 powers of 2:');
console.log(evaluate(['take', 15, 'pow2'], globalEnv));

// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PRACTICAL APPLICATIONS SUMMARY');
console.log('='.repeat(70));
console.log(`
✓ Data Validation & Transformation
✓ Statistical Analysis (avg, min, max)
✓ Business Logic (pricing, discounts)
✓ Data Filtering & Search
✓ Pagination Helpers
✓ Combinatorics (factorial, permutations)
✓ Prime Number Detection
✓ Financial Calculations (compound interest)
✓ Grade/Score Processing
✓ Infinite Sequence Processing (streams)

λ.json is useful for:
• Configuration files with embedded logic
• Data transformation pipelines
• Business rule engines
• Mathematical computations
• API response processing
• Educational tools
• Prototyping functional algorithms
• JSON-based DSLs (Domain Specific Languages)
`);
console.log('='.repeat(70));