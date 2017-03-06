'use strict';
const presetEnv = require('babel-preset-env').default;

module.exports = function(_targets) {
  let targets = _targets || require('./default-targets');
  let options = presetEnv(null, {
    browsers: targets.browsers,
    loose: true,
    modules: 'amd',
  });

  options.moduleIds = true;
  options.resolveModuleSource = require('amd-name-resolver').moduleResolve;

  return options;
};
