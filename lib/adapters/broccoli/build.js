var broccoli = require('broccoli'),
  helpers = broccoli.helpers;

function getBuilder () {
  var tree = helpers.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function build(options, done){
  return getBuilder().build();
};
