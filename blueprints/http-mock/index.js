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
    return this.addPackagesToProject([
      { name: 'morgan', target: '^1.3.2' },
      { name: 'connect-restreamer', target: '^1.0.0' }
    ]);
  }
};
