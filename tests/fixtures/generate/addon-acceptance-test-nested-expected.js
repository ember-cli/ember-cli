import { module, test } from 'qunit';
import startApp from '../../../tests/helpers/start-app';
import destroyApp from '../../../tests/helpers/destroy-app';

module('Acceptance | foo/bar', {
  beforeEach: function() {
    this.application = startApp();
  },

  afterEach: function() {
    destroyApp(this.application);
  }
});

test('visiting /foo/bar', function(assert) {
  visit('/foo/bar');

  andThen(function() {
    assert.equal(currentURL(), '/foo/bar');
  });
});
