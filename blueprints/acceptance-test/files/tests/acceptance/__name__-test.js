import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

QUnit.module('Acceptance: <%= classifiedModuleName %>', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

QUnit.test('visiting /<%= dasherizedModuleName %>', function(assert) {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    assert.equal(currentPath(), '<%= dasherizedModuleName %>');
  });
});
