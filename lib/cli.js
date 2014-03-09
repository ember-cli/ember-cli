var nopt = require('nopt'),
    commands = require('../lib/commands/commands'),
    chalk = require('chalk'),
    RSVP = require('rsvp'),
    Promise = RSVP.Promise,
    rest = require('lodash-node/modern/arrays/rest'),
    merge = require('lodash-node/modern/objects/merge'),
    path = require('path'),
    pkg = require('../package.json'),
    ui = require('./ui');

RSVP.on('error', function(error) {
  console.log(chalk.red('Unhandled Error'));
  throw error;
});

require('../lib/ext/promise');

module.exports = { run : run };

function run (argv) {
  new Cli(argv).run();
}

var types = {
  help: Boolean,
  version: Boolean
};

var shorthands = {
  h: '--help',
  v: '--version'
};

function Cli(argv) {
  this.opts = nopt(types, shorthands, argv);
  this.cmd = this.opts.argv.remain[0];
}

Cli.prototype.runCurrentCommand = function() {
  var cmd = this.cmd;
  var action = commands[cmd];

  if (cmd && !action) {
    ui.write('The specified command ' + chalk.underline(cmd) + ' is invalid, for avaiable options see `ember help`\n\n');
    return;
  }

  if (!action) {
    action = commands.help;
  }

  var opts = nopt.apply(null, action.options);

  var args = rest(this.opts.argv.remain);
  var options = merge(opts, {
    appRoot: process.cwd(),
    cliRoot: path.resolve(path.join(__dirname, '..'))
  });

  args.push(options);

  return action.run.apply(this, args);
};

Cli.prototype.run = function() {
  var opts = this.opts;

  if (opts.version) {
    ui.write('ember-cli ' + pkg.version + '\n');
    return 0;
  } else if (opts.help) {
    this.cmd = 'help';
  }

  this.runCurrentCommand();
};
