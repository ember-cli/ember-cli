import <%= camelizedModuleName %> from '../../../utils/<%= dasherizedModuleName %>';
import { module, test } from 'qunit';

module('<%= camelizedModuleName %>');

// Replace this with your real tests.
test('it works', function(assert) {
  var result = <%= camelizedModuleName %>();
  assert.ok(result);
});
