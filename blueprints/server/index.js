/*jshint node:true*/

module.exports = {
  description: 'Generates a server directory for mocks and proxies.',

  normalizeEntityName: function() {},

  afterInstall: function(options) {
    var pkgContent = this.project.pkg;

    var isMorganMissing = !( pkgContent.devDependencies['morgan'] ||  (pkgContent.dependencies && pkgContent.dependencies['morgan']) );
    var isGlobMissing = !( pkgContent.devDependencies['glob'] ||  (pkgContent.dependencies && pkgContent.dependencies['glob']) );

    var areDependenciesMissing = isMorganMissing || isGlobMissing;
    var libsToInstall = [];

    if (isMorganMissing) {
      libsToInstall.push({ name: 'morgan', target: '^1.3.2' });
    }

    if (isGlobMissing) {
      libsToInstall.push({ name: 'glob', target: '^4.0.5' });
    }

    if (!options.dryRun && areDependenciesMissing) {
      return this.addPackagesToProject(libsToInstall);	
    }
    
  }
};
