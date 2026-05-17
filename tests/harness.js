let passed = 0;
let failed = 0;

export function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => { console.log(`%c✓ ${name}`, 'color:#9fffcc'); passed++; })
        .catch(e => { console.error(`✗ ${name}: ${e.message}`); failed++; });
    } else {
      console.log(`%c✓ ${name}`, 'color:#9fffcc');
      passed++;
    }
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

export function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

export function assertEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

export function summary() {
  setTimeout(() => console.log(`\nResults: ${passed} passed, ${failed} failed`), 200);
}
