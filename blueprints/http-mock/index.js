/*jshint node:true*/
var Blueprint = require('../../lib/models/blueprint');

module.exports = {
  description: 'Generates a mock api endpoint in /api prefix.',

  anonymousOptions: [
    'endpoint-path'
  ],

  locals: function(options) {
    return {
      path: '/' + options.entity.name.replace(/^\//, '')
    };
  },

  beforeInstall: function(options) {
    var serverBlueprint = Blueprint.lookup('server', {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return serverBlueprint.install(options);
  },

  afterInstall: function(options) {
    var pkgContent = this.project.pkg;
    var isExpressMissing = !( pkgContent.devDependencies['express'] || (pkgContent.dependencies && pkgContent.dependencies['express']) );

    if (!options.dryRun && isExpressMissing) {
      return this.addPackagesToProject([
        { name: 'express', target: '^4.8.5' }
      ]);  
    } 

  }
};
