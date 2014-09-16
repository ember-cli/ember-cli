var EOL = require('os').EOL;

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
  afterInstall: function() {
    return this.addPackageToProject('connect-restreamer', '^1.0.0');
  }
};
