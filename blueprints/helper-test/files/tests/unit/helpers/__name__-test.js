import {
  <%= camelizedModuleName %>
} from '../../../helpers/<%= dasherizedModuleName %>';
import { module, test } from 'qunit';

module('<%= classifiedModuleName %>Helper');

// Replace this with your real tests.
test('it works', function(assert) {
  var result = <%= camelizedModuleName %>(42);
  assert.ok(result);
});
