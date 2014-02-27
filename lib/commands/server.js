var Promise = require('rsvp').Promise,
    path = require('path'),
    adapt = require('../adapters'),
    chalk = require('chalk');

var root = path.resolve(path.join(__dirname, '..', '..'));

module.exports.options = [{
  'port': Number,
  'autotest': Boolean, // TODO
  'environment': ['development', 'production'],
  'app': path
}];

module.exports.run = function run(options) {
  var adapter = adapt.to('broccoli');

  adapter.server(options);

  return new Promise(function(){ }); // runs for-ever
};

module.exports.usage = function usage() {
    return 'ember server\n' +
    '      --autotest   ' + chalk.green('[default: false]')+'\n' +
    '      --port       ' + chalk.green('[default: 8000]')+'\n' +
    '      --subscribe  ' + chalk.green('[default:release, optional: (beta|canary)]')+'\n' +
    '                     ' + chalk.green('#') + ' on "start" of an app, it will prompt the user if the channel they\n' +
    '                     ' + chalk.green('#') + ' subscribe to has an update.\n' +
    '                     ' + chalk.green('#') + ' if an update occured. they are asked ' + chalk.green('[yes, no]') + ' to try the update (using bower)\n' +
    '                     ' + chalk.green('#') + '   (what about other libs? ember-data or components or..)\n' +
    '      --env        ' + chalk.green('[default: development] #')+' allow previewing the various build envs.\n' +
    '      --app        ' + chalk.green('[default: .]')+'\n';
}