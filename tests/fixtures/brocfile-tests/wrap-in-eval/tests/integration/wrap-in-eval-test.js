/*jshint strict:false */
/* globals test, expect, equal, visit, andThen */

import Ember from 'ember';
import startApp    from '../helpers/start-app';

var App;

module('wrapInEval in-app test', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});


test('the application boots properly with wrapInEval', function() {
  expect(1);

  visit('/');

  andThen(function() {
    equal(Ember.$('#title').text(), 'Welcome to Ember.js');
  });
});
