import Ember from 'ember';
import startApp from '../helpers/start-app';

var App;

module('Acceptance', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

test('renders properly', function() {
  visit('/');

  andThen(function() {
    var element = find('.basic-thing');
    equal(element.first().text().trim(), 'WOOT!!');
  });
});
