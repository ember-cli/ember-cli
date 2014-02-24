var broccoli = require('broccoli'),
  helpers = broccoli.helpers,
  Promise = require('rsvp').Promise;

function getBuilder () {
  var tree = helpers.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options, done) {
  broccoli.server.serve(getBuilder());

  return Promise.resolve(); // server current runs forever
};
