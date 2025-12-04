// Quick OT correctness checks; run with: node lib/ot/test_otText.js
const ot = require('./otText');

function op(desc) {
  // convenience: convert tuple-like into our op format
  // types supported:
  //  - ['ins', pos, text]
  //  - ['del', pos, n]
  //  - ['ret', n]
  if (desc[0] === 'ins') {
    const [_, pos, text] = desc;
    return [pos > 0 ? pos : undefined, text].filter(Boolean);
  }
  if (desc[0] === 'del') {
    const [_, pos, n] = desc;
    return [pos > 0 ? pos : undefined, { d: n }].filter(Boolean);
  }
  if (desc[0] === 'ret') {
    const [_, n] = desc;
    return [n];
  }
  throw new Error('unknown desc');
}

function retain(n) { return n > 0 ? [n] : []; }
function insAt(pos, text) { return ot.normalize([...(pos>0? [pos] : []), text]); }
function delAt(pos, n) { return ot.normalize([...(pos>0? [pos] : []), { d: n }]); }

function applyOp(s, o) { return ot.apply(s, o); }

function converge(initial, A, B) {
  // Transform A against B and B against A; apply in opposite orders, expect same final
  const A1 = ot.transform(A, B);
  const B1 = ot.transform(B, A);
  const sAB = applyOp(applyOp(initial, B), A1);
  const sBA = applyOp(applyOp(initial, A), B1);
  if (sAB !== sBA) {
    throw new Error(`Convergence failed:\n initial=${JSON.stringify(initial)}\n A=${JSON.stringify(A)}\n B=${JSON.stringify(B)}\n A'=${JSON.stringify(A1)}\n B'=${JSON.stringify(B1)}\n sAB=${JSON.stringify(sAB)}\n sBA=${JSON.stringify(sBA)}`);
  }
  return sAB;
}

function eq(name, a, b) {
  if (a !== b) throw new Error(`${name} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
}

(function run(){
  // Example from prompt: initial 'abc'
  const O1 = insAt(0, 'x');              // Insert[0, "x"] -> ["x"]
  const O2 = ot.normalize([2, { d: 1 }]); // Delete[2,1]
  const O2prime = ot.transform(O2, O1);
  eq('O2\' should be retain3,del1', JSON.stringify(O2prime), JSON.stringify([3,{d:1}]));
  const after = applyOp('abc', ot.normalize([...O1, ...O2prime]));
  eq('final should be xab', after, 'xab');

  // Concurrent same index inserts should preserve both and shift positions
  const I1 = insAt(0, 'A');
  const I2 = insAt(0, 'B');
  converge('', I1, I2);

  // Insert vs delete nearby
  converge('hello', insAt(1,'X'), delAt(3,1));

  // Overlapping deletes
  converge('abcdef', ot.normalize([1,{d:3}]), ot.normalize([2,{d:2}]));

  // Insert far and retain runs
  converge('lorem', insAt(5,'!'), retain(3));

  console.log('otText basic tests passed');
})();
