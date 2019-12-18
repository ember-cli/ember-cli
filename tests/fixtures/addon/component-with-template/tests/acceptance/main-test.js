import Ember from 'ember';
import { setupApplicationTest } from 'ember-qunit';
import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

module('Acceptance', function(hooks) {
  setupApplicationTest(hooks);

  test('renders properly', async function (assert) {
    await visit('/');

    var element = this.element.querySelector('.basic-thing');
    assert.equal(element.textContent.trim(), 'WOOT!!');
  });

  test('renders imported component', async function (assert) {
    await visit('/');

    var element = this.element.querySelector('.second-thing');
    assert.equal(element.textContent.trim(), 'SECOND!!');
  });
});
