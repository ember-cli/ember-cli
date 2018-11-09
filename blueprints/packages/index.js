'use strict';

const fs = require('fs-extra');

module.exports = {
  description: 'Generates a packages directory for module unification in-repo addons.',

  normalizeEntityName(name) { return name; },

  beforeInstall() {
    // make sure to create `packages` directory
    fs.mkdirsSync('packages');
  },
};
