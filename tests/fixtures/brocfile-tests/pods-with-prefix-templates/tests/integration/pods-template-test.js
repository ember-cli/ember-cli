/*jshint strict:false */
/* globals test, expect, equal, visit, andThen */

import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

module('pods based templates', {
  setup: function() {
    application = startApp();
  },
  teardown: function() {
    Ember.run(application, 'destroy');
  }
});


test('the application boots properly with pods based templates with a podModulePrefix set', function() {
  expect(1);

  visit('/');

  andThen(function() {
    equal(Ember.$('#title').text(), 'ZOMG, PODS WORKS!!');
  });
});
