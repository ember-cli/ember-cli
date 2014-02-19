var commander = require("commander"),
    RSVP = require("rsvp"),
    path = require("path"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports.options = [{
  "port": Number,
  "autotest": Boolean, // TODO
  "environment": ["development", "production"],
  "app": path
}];

module.exports.run = function run(options) {

  // TODO: Remove adapters once broccoli integration is ready
  var adapterName = "grunt";

  if(process.env.BROCCOLI) {
    adapterName = "broccoli";
  }

  var adapter = adapt.to(adapterName);

  return new RSVP.Promise(function(resolve, reject) {
    adapter.server(options, resolve);
  });

};


