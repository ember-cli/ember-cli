module.exports = {
  description: 'Generates a blueprint and definition.',

  files: function() {
    var files = this._super.files.apply(this, arguments);

    if (!this.hasJSHint()) {
      files = files.filter(function(file) {
        return file !== 'blueprints/.jshintrc';
      });
    }

    return files;
  },

  hasJSHint: function() {
    if (this.project) {
      return 'ember-cli-jshint' in this.project.dependencies();
    }
  }
};
