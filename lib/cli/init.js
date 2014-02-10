var commander = require("commander"),
    path = require("path"),
    skeleton = require("../skeleton"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function run() {

  var defaultName = path.basename(process.cwd());

  commander
    .usage("<options>")
    .option("-n, --name <name>", "The name to use as the primary namespace for this app", defaultName)
    .option("--dry-run", "Print actions it will perform without modifying any files", false);


  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

  return skeleton.installInto(commander.appRoot, commander.name, commander.dryRun);

};
