import { setupApplicationTest } from 'ember-qunit';
import QUnit, { module, test } from 'qunit';

let firstArgument;

module('Module', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    firstArgument = assert;
  });

  test('it works', function(assert) {
    assert.ok(this.owner, 'setupApplicationTest binds to the context');
    assert.ok(
      Object.getPrototypeOf(firstArgument) === QUnit.assert,
      'first argument is QUnit assert'
    );
  });
});
