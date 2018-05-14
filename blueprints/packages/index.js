'use strict';

const fs = require('fs-extra');

module.exports = {
  description: 'Generates a packages directory for module unification in-repo addons.',

  normalizeEntityName(name) { return name; },

  beforeInstall() {
    // make sure to create `packages` directory even if .jshintrc is not created
    fs.mkdirsSync('packages');
  },

  files() {
    return [this.hasJSHint() ? 'packages/.jshintrc' : 'packages/.eslintrc.js'];
  },

  hasJSHint() {
    if (this.project) {
      return 'ember-cli-jshint' in this.project.dependencies();
    }
  },
};
