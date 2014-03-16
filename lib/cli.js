var nopt = require('nopt'),
    chalk = require('chalk'),
    RSVP = require('rsvp'),
    Promise = RSVP.Promise,
    merge = require('lodash-node/modern/objects/merge'),
    path = require('path'),
    pkg = require('../package.json');

RSVP.on('error', function(error) {
  console.log(chalk.red('Unhandled Error'));
  throw error;
});

require('../lib/ext/promise');

module.exports = Cli;

Cli.run = function run (argv) {
  new Cli(argv, require('../lib/commands/commands'), require('./ui')).run();
};

var types = {
  help: Boolean,
  version: Boolean
};

var shorthands = {
  h: '--help',
  v: '--version'
};

function Cli(argv, commands, ui) {
  this.argv = argv;
  this.opts = nopt(types, shorthands, argv);
  this.cmd = this.opts.argv.remain[0];
  this.commands = commands;

  this.ui = ui;
}

Cli.prototype.runCurrentCommand = function() {
  var cmd = this.cmd;
  var action = this.commands[cmd];

  if (cmd && !action) {
    this.ui.write('The specified command ' + chalk.underline(cmd) + ' is invalid, for avaiable options see `ember help`\n\n');
    return;
  }

  if (!action) {
    action = this.commands.help;
  }

  var opts = nopt(action.types, action.shorthands, this.argv);

  var options = merge({}, opts, {
    appRoot: process.cwd(),
    cliRoot: path.resolve(path.join(__dirname, '..'))
  });

  var args = options.argv.remain.slice();
  args.shift();
  args.push(options);

  return action.run.apply(action, args);
};

Cli.prototype.run = function() {
  var opts = this.opts;

  if (opts.version) {
    this.ui.write('ember-cli ' + pkg.version + '\n');
    return 0;
  } else if (opts.help) {
    this.cmd = 'help';
  }

  this.runCurrentCommand();
};
