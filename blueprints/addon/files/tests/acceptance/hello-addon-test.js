import Ember from 'ember';
import startApp from 'ember-token-auth/tests/helpers/start-app';

var App;

module('Acceptance - Hello Addon', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    window.history.pushState('','','/tests');
    Ember.run(App, 'destroy');
  }
});

test('hello-addon renders', function() {
  expect(2);

  visit('/hello-addon').then(function() {
    var title = find('h2#title');
    var text = find('p#hello-addon');

    equal(title.text(), 'Welcome to Ember.js');

    equal(text.text(), 'Hello, Addon!');
  });
});
