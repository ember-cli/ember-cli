import Ember from 'ember';
import startApp from '../helpers/start-app';
import { module, test } from 'qunit';

module('Acceptance', {
  beforeEach: function() {
    this.application = startApp();
  },
  afterEach: function() {
    Ember.run(this.application, 'destroy');
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
