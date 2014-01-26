var commander = require("commander");

module.exports = function emberCLI() {
  commander
    .usage("[options] <command> [<args>...]")
    .on("--help", function() {
      console.log("  Available commands:");
      console.log();
      console.log("    build [env-name] [output-dir]");
      console.log("    server ");
    });

  commander
    .command("build [environment]", "Builds your ember app in the most awesome way possible.");

  commander.parse(process.argv)
};
