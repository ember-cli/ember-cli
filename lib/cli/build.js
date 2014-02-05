var commander = require("commander"),
    path = require("path"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-o, --output <path>", "Directory to build to", "build");

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

  // TODO: Remove adapters once broccoli integration is ready
  commander.adapter = "grunt";

  if(process.env.BROCCOLI) {
    commander.adapter = "broccoli";
  }

  commander.parse(process.argv);
  if(commander.args.length==0){
    console.log("   try 'ember build --help'.")
  }
};

