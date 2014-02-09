var commander = require("commander"),
    path = require("path"),
    skeleton = require("../skeleton"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [name]");

  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

  console.log("installing app");
  skeleton.installInto(commander.appRoot);

};
