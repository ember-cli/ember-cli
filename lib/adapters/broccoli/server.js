var broccoli = require('broccoli'),
  helpers = broccoli.helpers,
  Promise = require('rsvp').Promise;

function getBuilder () {
  var tree = helpers.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options, done) {
  broccoli.server.serve(getBuilder(), {
    host: '0.0.0.0',
    port: (process.env.PORT || 4200)
  });

  return Promise.resolve(); // server current runs forever
};
