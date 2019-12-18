import Ember from 'ember';
import { setupApplicationTest } from 'ember-qunit';
import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

module('default-development - Integration', function(hook) {
  setupApplicationTest(hooks);

  test('renders properly', async function (assert) {
    await visit('/');

    var elements = this.element.querySelectorAll('.ember-view');
    assert.ok(elements.length > 0);
  });
});
