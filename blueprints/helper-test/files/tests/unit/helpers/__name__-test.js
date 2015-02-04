import {
  <%= camelizedModuleName %>
} from '../../../helpers/<%= dasherizedModuleName %>';

QUnit.module('<%= classifiedModuleName %>Helper');

// Replace this with your real tests.
QUnit.test('it works', function(assert) {
  var result = <%= camelizedModuleName %>(42);
  assert.ok(result);
});
