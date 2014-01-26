var commander = require("commander"),
    path = require("path");

function getFullPath(inPath) {
  if(!inPath.match(/^\//)) {
    return path.join(process.cwd(), inPath);
  } else {
    return inPath;
  }
}

module.exports = function emberCLI() {
  commander
    .usage("<options> [env-name]")
    .option("-o, --output <path>", "Directory to build to", "build");

  commander
    .command("development")
    .action(function() {
      console.log("grunt build:debug", getFullPath(commander.output));
    });

  commander.
    command("production")
    .action(function() {
      console.log("grunt build:dist", commander.output);
    });

  commander.parse(process.argv);

};

