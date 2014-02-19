var commander = require("commander"),
    path = require("path"),
    skeleton = require("../skeleton"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports.options = {
  dryRun: [Boolean]
};

module.exports.run = function run(name, options) {

  var defaultName = path.basename(process.cwd());

  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

  return skeleton.installInto(options.cliRoot, name, options['dry-run']);

};
