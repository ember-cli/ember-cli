var Promise   = require('../../lib/ext/promise');

module.exports = {
  description: 'Generates a relative proxy to another server.',

  anonymousOptions: [
    'local-path',
    'remote-url'
  ],

  locals: function(options) {
    var proxyUrl = options.args[2];
    return {
      path: '/' + options.entity.name.replace(/^\//, ''),
      proxyUrl: proxyUrl
    };
  },

  afterInstall: function() {
    return this.addPackagesToProject([
      { name: 'http-proxy', target: '^1.1.6' },
      { name: 'morgan', target: '^1.3.2' }
    ]);
  }
};
