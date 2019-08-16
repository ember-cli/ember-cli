import { module, test } from 'qunit';

import stringFn from './string';

module('Unit | Utility | string', function() {

  test('returns hola', function(assert) {
    assert.equal(stringFn(), 'hola');
  });

});
