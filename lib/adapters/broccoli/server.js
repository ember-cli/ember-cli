var broccoli = require('broccoli'),
  helpers = broccoli.helpers,
  Promise = require('rsvp').Promise;

function getBuilder () {
  var tree = helpers.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options, done) {
  broccoli.server.serve(getBuilder(), {
    host: options.host,
    port: options.port
  });

  return new Promise(function(){ }); // runs for-ever
};
