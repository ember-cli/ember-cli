'use strict';

module.exports = function processModulesOnly(tree, annotation) {
  let options = {
    plugins: [
      [require.resolve('babel-plugin-transform-es2015-modules-amd'), { loose: true, noInterop: true }],
    ],
    moduleIds: true,
    resolveModuleSource: require('amd-name-resolver').moduleResolve,
    annotation,
  };

  const Babel = require('broccoli-babel-transpiler');
  return new Babel(tree, options);
};
