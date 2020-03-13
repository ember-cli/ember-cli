import { setupApplicationTest } from 'ember-qunit';
import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

module('pods based templates', function(hooks) {
  setupApplicationTest(hooks);

  test('the application boots properly with pods based templates', async function (assert) {
    assert.expect(1);

    await visit('/');

    let actual = this.element.querySelector('#title').textContent
    assert.equal(actual, 'ZOMG, PODS WORKS!!');
  });
});
