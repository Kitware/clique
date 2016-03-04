import test from 'tape';
import * as util from '../src/clique/util';

import * as roni from '../src/clique/roni';

test('util.concat()', t => {
  t.deepEqual(util.concat(), [], 'Empty concatenation is the empty array');
  t.deepEqual(util.concat([1]), [1], 'The concatenation of a single array is that array');
  t.deepEqual(util.concat([1], [2, 3]), [1, 2, 3], 'Concatentation of two arrays works');
  t.deepEqual(util.concat([1], [2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6], 'Concatentation of three arrays works');

  t.end();
});
