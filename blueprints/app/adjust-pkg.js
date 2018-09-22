'use strict';

const sortPackageJson = require('sort-package-json');

const stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');

module.exports = function adjustPackageJson(content) {
  let locals = this.locals(this.options);

  let pkg = JSON.parse(content);

  pkg.name = locals.addonName || locals.name;
  pkg.devDependencies['ember-cli'] = `~${locals.emberCLIVersion}`;

  if (!locals.welcome) {
    delete pkg.devDependencies['ember-welcome-page'];
  }

  return stringifyAndNormalize(sortPackageJson(pkg));
};
