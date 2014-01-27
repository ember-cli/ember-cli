var commander = require("commander"),
    path = require("path"),
    builders = require("../builders");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-o, --output <path>", "Directory to build to", "build")
    .option("-b, --builder <builder>", "Builder plugin to use", "grunt");

  commander
    .command("development")
    .action(function() {
      var builder = builders.buildWith(commander.builder);
      builder.build({
        environment: "development",
        appRoot: commander.appRoot,
        cliRoot: commander.cliRoot
      });
    });

  commander.
    command("production")
    .action(function() {
      var builder = builders.buildWith(commander.builder);
      builder.build({
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

