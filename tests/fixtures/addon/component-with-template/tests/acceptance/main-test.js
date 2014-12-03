import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

module('Acceptance', {
  setup: function() {
    application = startApp();
  },
  teardown: function() {
    Ember.run(application, 'destroy');
  }
});

test('renders properly', function() {
  visit('/');

  andThen(function() {
    var element = find('.basic-thing');
    equal(element.first().text().trim(), 'WOOT!!');
  });
});

test('renders imported component', function() {
  visit('/');

  andThen(function() {
    var element = find('.second-thing');
    equal(element.first().text().trim(), 'SECOND!!');
  });
});
