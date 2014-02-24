var Promise = require('rsvp').Promise,
    path = require('path'),
    adapt = require('../adapters');

var root = path.resolve(path.join(__dirname, '..', '..'));

module.exports.options = [{
  output: path
}, {
  o: ['output']
}];

module.exports.run = function run(env, options) {
  if (typeof env === 'object') {
    options = env;
    env = 'development';
  }

  var adapter = adapt.to('broccoli');

  return new Promise(function(resolve) {
    resolve(adapter.build({
      environment: env,
      outputPath: options.output,
      appRoot: options.appRoot,
      cliRoot: options.cliRoot
    }));
  });
};

