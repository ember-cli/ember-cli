/*jshint node:true*/
var fs   = require('fs-extra');
var path = require('path');
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
    var packagePath = path.join(this.project.root, 'package.json');
    var contents    = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));
    var isExpressMissing = !contents.devDependencies['express'];

    if(!options.dryRun && isExpressMissing){
      return this.addPackagesToProject([
        { name: 'express', target: '^4.8.5' }
      ]);  
    } 

  }
};
