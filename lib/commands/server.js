var commander = require("commander"),
    path = require("path"),
    adapt = require("../adapters");

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-p, --port <port>", "Customize the port [TODO]", 8000)
    .option("-s, --subscribe <channel>", "Release channel to watch for updates [TODO]", "release")
    .option("--autotest", "Rerun tests on save [TODO]", false)
    .option("-e, --environment <environment>", "Environment to use for preview server settings [TODO]", "development")
    .option("--app <directory>", "Root directory of app to serve", process.cwd())

  commander.cliRoot = path.resolve(path.join(__dirname, "..", ".."));
  commander.appRoot = process.cwd();

  commander.parse(process.argv);

  // TODO: Remove adapters once broccoli integration is ready
  commander.adapter = "grunt";

  if(process.env.BROCCOLI) {
    commander.adapter = "broccoli";
  }

  var adapter = adapt.to(commander.adapter);

  adapter.server(commander);

};


