var commander = require("commander");

module.exports = function emberCLI() {
  commander
    .version('0.0.0')
    .usage("[options] <command> [<args>...]")
    .on("--help", function() {
      console.log("  Available commands:");
      console.log();
      console.log("    build [env-name] [output-dir]");
      console.log("    init app-name");
      console.log("    server ");
    });

  commander
    .command("build [environment]", "Builds your ember app in the most awesome way possible.")
    .command("server", "Starts a preview server for your app")
    .command("init", "Scaffolds a new ember app");

  commander.parse(process.argv)
  if(commander.args.length==0){
    console.log("   try 'ember --help'.")
  }
};
