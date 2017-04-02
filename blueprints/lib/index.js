'use strict';

const fs = require('fs-extra');

module.exports = {
  description: 'Generates a lib directory for in-repo addons.',

  normalizeEntityName(name) { return name; },

  beforeInstall() {
    // make sure to create `lib` directory even if .jshintrc is not created
    fs.mkdirsSync('lib');
  },

  files() {
    return [this.hasJSHint() ? 'lib/.jshintrc' : 'lib/.eslintrc.js'];
  },

  hasJSHint() {
    if (this.project) {
      return 'ember-cli-jshint' in this.project.dependencies();
    }
  },
};
