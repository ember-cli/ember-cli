var Promise = require('rsvp').Promise,
    path = require('path'),
    adapt = require('../adapters'),
    chalk = require('chalk');

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

module.exports.usage = function usage() {
    return 'ember build ' + chalk.yellow('<env-name>') + ' ' + chalk.green('[default: development] [optional: target path]');
}