import Ember from 'ember';
import startApp from '../helpers/start-app';
import { module, test } from 'qunit';

var application;

module('Acceptance', {
  beforeEach: function() {
    application = startApp();
  },
  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('renders properly', function(assert) {
  visit('/');

  andThen(function() {
    var element = find('.basic-thing');
    assert.equal(element.first().text().trim(), 'WOOT!!');
  });
});

test('renders imported component', function(assert) {
  visit('/');

  andThen(function() {
    var element = find('.second-thing');
    assert.equal(element.first().text().trim(), 'SECOND!!');
  });
});
