var fs = require('fs-extra');

module.exports = {
  description: 'Generates a lib directory for in-repo addons.',

  normalizeEntityName: function(name) { return name; },

  beforeInstall: function() {
    // make sure to create `lib` directory even if .jshintrc is not created
    fs.mkdirsSync('lib');
  },

  files: function() {
    return this.hasJSHint() ? ['lib/.jshintrc'] : [];
  },

  hasJSHint: function() {
    if (this.project) {
      return 'ember-cli-jshint' in this.project.dependencies();
    }
  }
};
