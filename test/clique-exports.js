import test from 'tape';

import clique from './../src/clique.js';

test('Check for all parts of ES5-compatible clique object', t => {
  t.ok(clique, 'clique exists');
  t.ok(clique.hello, 'clique.hello() exists');
  t.end();
});
