/*jshint strict:false */
/* globals QUnit, visit, andThen */

import Ember from 'ember';
import startApp from '../helpers/start-app';
import { module, test } from 'qunit';

var application;

module('pods based templates', {
  beforeEach: function() {
    application = startApp();
  },
  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});


test('the application boots properly with pods based templates with a podModulePrefix set', function(assert) {
  assert.expect(1);

  visit('/');

  andThen(function() {
    assert.equal(Ember.$('#title').text(), 'ZOMG, PODS WORKS!!');
  });
});
