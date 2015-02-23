import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from '<%= dasherizedPackageName %>/tests/helpers/start-app';

var application;

module('Acceptance: <%= classifiedModuleName %>', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /<%= dasherizedModuleName %>', function(assert) {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    assert.equal(currentPath(), '<%= dasherizedModuleName %>');
  });
});
