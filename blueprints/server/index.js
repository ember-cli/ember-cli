/*jshint node:true*/
var fs   = require('fs-extra');
var path = require('path');

module.exports = {
  description: 'Generates a server directory for mocks and proxies.',

  normalizeEntityName: function() {},

  afterInstall: function(options) {
    var packagePath = path.join(this.project.root, 'package.json');
    var contents    = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));

    var isMorganMissing = !contents.devDependencies['morgan'];
    var isGlobMissing = !contents.devDependencies['glob'];
    var areDependenciesMissing = isMorganMissing || isGlobMissing;
    var libsToInstall = [];

    if(isMorganMissing) {
      libsToInstall.push({ name: 'morgan', target: '^1.3.2' });
    }

    if(isGlobMissing) {
      libsToInstall.push({ name: 'glob', target: '^4.0.5' });
    }

    if(!options.dryRun && areDependenciesMissing) {
      return this.addPackagesToProject(libsToInstall);	
    }
    
  }
};
