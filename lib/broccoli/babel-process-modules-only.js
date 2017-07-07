'use strict';

const path = require('path');

const ModulesTransform = (function() {
  let plugin = require('babel-plugin-transform-es2015-modules-amd');

  // adding `baseDir` ensures that broccoli-babel-transpiler does not
  // issue a warning and opt out of caching
  let pluginPath = require.resolve('babel-plugin-transform-es2015-modules-amd/package');
  let pluginBaseDir = path.dirname(pluginPath);
  plugin.baseDir = () => pluginBaseDir;

  return plugin;
})();

module.exports = function processModulesOnly(tree, annotation) {
  let options = {
    plugins: [
      [ModulesTransform, { loose: true, noInterop: true }],
    ],
    moduleIds: true,
    resolveModuleSource: require('amd-name-resolver').moduleResolve,
    annotation,
  };

  const Babel = require('broccoli-babel-transpiler');
  return new Babel(tree, options);
};
