import { module, test } from 'qunit';
import startApp from 'my-app/tests/helpers/start-app';
import destroyApp from 'my-app/tests/helpers/destroy-app';

module('Acceptance | foo', {
  beforeEach: function() {
    this.application = startApp();
  },

  afterEach: function() {
    destroyApp(this.application);
  }
});

test('visiting /foo', function(assert) {
  visit('/foo');

  andThen(function() {
    assert.equal(currentURL(), '/foo');
  });
});
