'use strict';

module.exports = function processModulesOnly(tree, annotation) {
  let options = {
    plugins: [
      // this sucks, but :goodnews: once a new version of babel@6 is released
      // we can remove this in favor of `babel-plugin-transform-es2015-modules-amd`
      [require('rwjblue-custom-babel-6-amd-modules-no-interop'), { loose: true, noIterop: true }],
    ],
    moduleIds: true,
    resolveModuleSource: require('amd-name-resolver').moduleResolve,
    annotation,
  };

  const Babel = require('broccoli-babel-transpiler');
  return new Babel(tree, options);
};
