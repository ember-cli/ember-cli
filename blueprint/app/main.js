/* global requirejs, require */

export default function bootApp(prefix, attributes) {
  var App                = require(prefix + '/app')['default'];
  var initializersRegExp = new RegExp(prefix + '/initializers');

  Ember.keys(requirejs._eak_seen).filter(function(key) {
    return initializersRegExp.test(key);
  }).forEach(function(moduleName) {
    var module = require(moduleName, null, null, true);
    if (!module) { throw new Error(moduleName + ' must export an initializer.'); }
    App.initializer(module['default']);
  });

  return App.create(attributes || {});
}
