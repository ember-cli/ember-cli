import { test } from 'qunit';
import config from '../../config/environment';

test('the correct config is used', function(assert) {
  assert.strictEqual(config.fileUsed, 'config/something-else.js');
});
