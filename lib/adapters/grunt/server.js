var grunt = require("grunt"),
    path = require("path");

var envTasks = {
  "development": "server",
  "production": "server:dist"
};

module.exports = function(options) {
  grunt.cli.tasks = [envTasks[options.environment]];
  grunt.cli.options = {
    base: options.app,
    appRoot: options.app,
    cliRoot: options.cliRoot,
    port: options.port,
    outputPath: options.outputPath || "dist/"
  };

  grunt.cli({name: "build", gruntfile: path.join(options.cliRoot, "Gruntfile.js")});
}
