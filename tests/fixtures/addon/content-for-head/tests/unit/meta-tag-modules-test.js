import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application');

test('element exists', function(assert) {
  var elem = document.getElementById('something');

  assert.ok(elem);
});

test('meta tag modules work', function(assert) {
  let route = this.subject();

  var config = route.model();

  assert.equal(config.value, '1234');
});
