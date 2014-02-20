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
  // TODO: Move usage into help export
  // commander
  //   .usage('<options> [env-name]')
  //   .option('-o, --output <path>', 'Directory to build to', 'build');

  // TODO: Remove adapters once broccoli integration is ready
  var adapterName = 'grunt';

  if (typeof env === 'object') {
    options = env;
    env = 'development';
  }

  if (process.env.BROCCOLI) {
    adapterName = 'broccoli';
  }

  var adapter = adapt.to(adapterName);

  return new Promise(function(resolve) {
    adapter.build({
      environment: env,
      outputPath: options.output,
      appRoot: options.appRoot,
      cliRoot: options.cliRoot
    }, resolve);
  });
};

