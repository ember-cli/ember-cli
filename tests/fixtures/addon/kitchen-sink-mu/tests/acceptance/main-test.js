import { setupApplicationTest } from 'ember-qunit';
import { visit } from '@ember/test-helpers';
// import truthyHelper from 'some-cool-addon/test-support/helper';
import { module, test } from 'qunit';

module('Acceptance', function(hooks) {
  setupApplicationTest(hooks);

  /*
  test('renders properly', async function(assert) {
    await visit('/');

    var element = this.element.querySelector('.basic-thing');
    assert.equal(element.textContent.trim(), 'WOOT!!');
    // assert.ok(truthyHelper(), 'addon-test-support helper');
  });
  */

  test('renders imported component', async function(assert) {
    await visit('/');

    var element = this.element.querySelector('.second-thing');
    assert.equal(element.textContent.trim(), 'SECOND!!');
  });
});
