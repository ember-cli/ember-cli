import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import { module, test } from 'qunit';
import currentText from 'some-cool-addon/test-support/current-text';

module('Acceptance', {
  beforeEach: function() {
    this.application = startApp();
  },
  afterEach: function() {
    destroyApp(this.application);
  }
});

test('can invoke helper', function(assert) {
  assert.expect(1);

  visit('/')
    .then(() => {
      assert.ok(currentText(this.application).indexOf('Stuff Here!') !== -1);
    });
});
