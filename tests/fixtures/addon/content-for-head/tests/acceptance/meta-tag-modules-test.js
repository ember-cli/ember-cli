import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | meta tag modules');

test('visiting /', function(assert) {
  visit('/');

  andThen(function() {
    let result = Ember.$('#configvalue').html();
    assert.equal(result, '1234');
  });
});
