/*jshint node:true*/

module.exports = {
  description: 'Generates a server directory for mocks and proxies.',

  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addPackagesToProject([
      { name: 'morgan', target: '^1.3.2' },
      { name: 'glob', target: '^4.0.5' }
    ]);
  }
};
