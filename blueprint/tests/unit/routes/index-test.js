import {
  test,
  moduleFor
} from 'ember-qunit';

moduleFor('route:index', 'Unit - route/index');

test('IndexRoute is a valid Ember route', function() {
  var route = this.subject();
  ok(route instanceof Ember.Route);
});
