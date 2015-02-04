import <%= camelizedModuleName %> from '../../../utils/<%= dasherizedModuleName %>';

QUnit.module('<%= camelizedModuleName %>');

// Replace this with your real tests.
QUnit.test('it works', function(assert) {
  var result = <%= camelizedModuleName %>();
  assert.ok(result);
});
