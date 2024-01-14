function intsFrom(n) {
  return [...Array(n).keys()];
}

function countingNumsFrom(n) {
  return intsFrom(n).map((x) => ++x);
}

function mapIntsFrom(f, n) {
  return Array.from(Array(n), (_, x) => f(x));
}

console.log(intsFrom(33));
console.log(countingNumsFrom(33));

const sq = (x) => x * x * x;
console.log(mapIntsFrom(sq, 33));
