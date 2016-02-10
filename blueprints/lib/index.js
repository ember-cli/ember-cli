/*jshint node:true*/

module.exports = {
  description: 'Generates a lib or other directory for in-repo addons.',

  availableOptions: [
    {
      name: 'path',
      type: String,
      default: 'lib'
    }
  ],

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        return options.locals.path;
      }
    };
  },

  locals: function(options) {
    return {
      path: options.path
    };
  },

  normalizeEntityName: function(name) { return name; }
};
