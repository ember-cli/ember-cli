var commander = require("commander"),
    path = require("path"),
    skeleton = require("../skeleton"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {

  var defaultName = path.basename(process.cwd());

  commander
    .usage("<options>")
    .option("-n, --name <name>", "The name to use as the primary namespace for this app", defaultName);

  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

  skeleton.installInto(commander.appRoot, commander.name);

};
