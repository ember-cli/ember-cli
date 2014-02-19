var grunt = require("grunt"),
    path = require("path");

var envTasks = {
  "development": "server",
  "production": "server:dist"
};

module.exports = function(options, done) {
  var environment = options.environment || "development";
  grunt.cli.tasks = [envTasks[environment]];
  grunt.cli.options = {
    base: options.appRoot,
    appRoot: options.appRoot,
    cliRoot: options.cliRoot,
    port: options.port,
    outputPath: options.outputPath || "dist/"
  };

  grunt.cli({name: "build", gruntfile: path.join(options.cliRoot, "Gruntfile.js")}, done);
}
