import Ember from 'ember';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import { module, test } from 'qunit';

module('default-development - Integration', {
  beforeEach() {
    this.application = startApp();
  },
  afterEach() {
    destroyApp(this.application);
  }
});

test('the application boots properly', function(assert) {
  assert.expect(1);

  visit('/');

  andThen(function() {
    assert.ok(Ember.$('.ember-view').length > 0);
  });
});
