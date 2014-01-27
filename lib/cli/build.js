var commander = require("commander"),
    grunt = require("grunt"),
    helpers = require("../helpers"),
    path = require("path"),
    loadConfig = require("load-grunt-config");

var filterAvailable = helpers.filterAvailableTasks;

var _ = grunt.util._;

var root = path.resolve(path.join(__dirname, "..", ".."));

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-o, --output <path>", "Directory to build to", "build");

  commander
    .command("development")
    .action(function() {

      grunt.cli.tasks = ["build:debug"];
      grunt.cli.options = {
        base: process.cwd(),
        cliRoot: path.resolve(path.join(__dirname, "..", "..")),
        appRoot: process.cwd()
      };

      console.log(grunt.cli.config);
      grunt.cli({name: "build", gruntfile: path.join(root, "Gruntfile.js")});
    });

  commander.
    command("production")
    .action(function() {
      console.log("grunt build:dist", commander.output);
    });

  commander.parse(process.argv);

};

