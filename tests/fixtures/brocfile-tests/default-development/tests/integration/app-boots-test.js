/*jshint strict:false */
/* globals visit, andThen */

import Ember from 'ember';
import startApp from '../helpers/start-app';
import { module, test } from 'qunit';

module('default-development - Integration', {
  beforeEach: function() {
    this.application = startApp();
  },
  afterEach: function() {
    Ember.run(this.application, 'destroy');
  }
});


test('the application boots properly', function(assert) {
  assert.expect(1);

  visit('/');

  andThen(function() {
    assert.equal(Ember.$('#title').text(), 'Welcome to Ember');
  });
});
