import <%= camelizedModuleName %> from '../../../utils/<%= dasherizedModuleName %>';
import { module, test } from 'qunit';

module('<%= friendlyPrefix %> <%= camelizedModuleName %>');

// Replace this with your real tests.
test('it works', function(assert) {
  var result = <%= camelizedModuleName %>();
  assert.ok(result);
});
