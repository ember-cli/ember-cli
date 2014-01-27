var commander = require("commander"),
    path = require("path"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-o, --output <path>", "Directory to build to", "build")
    .option("-a, --adapter <adapter>", "Reserved for future use; defaults to grunt", "grunt");

  commander
    .command("development")
    .action(function() {
      var adapter = adapt.to(commander.adapter);
      adapter.build({
        environment: "development",
        appRoot: commander.appRoot,
        cliRoot: commander.cliRoot
      });
    });

  commander.
    command("production")
    .action(function() {
      var adapter = adapt.to(commander.adapter);
      adapter.build({
        environment: "production",
        outputPath: commander.output,
        appRoot: commander.appRoot,
        cliRoot: commander.cliRoot
      });
    });

  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

};

