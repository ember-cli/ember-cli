/*jshint strict:false */
/* globals QUnit, visit, andThen */

import Ember from 'ember';
import startApp from '../helpers/start-app';
import { module, test } from 'qunit';

var application;

module('default-development - Integration', {
  beforeEach: function() {
    application = startApp();
  },
  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});


test('the application boots properly', function(assert) {
  assert.expect(1);

  visit('/');

  andThen(function() {
    assert.equal(Ember.$('#title').text(), 'Welcome to Ember.js');
  });
});
