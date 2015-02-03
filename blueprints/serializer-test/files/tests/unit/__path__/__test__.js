import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('serializer:<%= dasherizedModuleName %>', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  var serializer = this.subject();
  assert.ok(serializer);
});
