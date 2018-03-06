import { test } from 'qunit';

test('wasm test', function(assert) {
  assert.expect(1);
  return WebAssembly.instantiateStreaming(fetch('/foo.wasm')).then(mod => {
    assert.ok(mod.instance, 'has instance');
  });
});
