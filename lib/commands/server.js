var Promise = require('rsvp').Promise,
    path = require('path'),
    adapt = require('../adapters');

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

  return Promise.resolve(); // server runs for ever
};
