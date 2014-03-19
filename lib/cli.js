'use strict';

var nopt = require('nopt');
var chalk = require('chalk');
var RSVP = require('rsvp');
var merge = require('lodash-node/modern/objects/merge');
var path = require('path');
var pkg = require('../package.json');
var Promise = require('rsvp').Promise;

RSVP.on('error', function(error) {
  console.log(chalk.red('Unhandled Error'));
  throw error;
});

var types = {
  help: Boolean,
  version: Boolean
};

var shorthands = {
  h: '--help',
  v: '--version',
};

var commandAliases = {
  g: 'generate',
  s: 'server',
  i: 'init'
};

require('../lib/ext/promise');

function Cli(argv, commands, ui) {
  this.argv = argv;
  this.opts = nopt(types, shorthands, argv);
  this.cmd = this.opts.argv.remain[0];
  this.commands = commands;

  this.ui = ui;
}

module.exports = Cli;

Cli.run = function run (argv, ui) {
  var commands = require('../lib/commands/commands');
  ui = ui || require('./ui');

  var cli = new Cli(argv, commands, ui);

  return Promise.resolve(cli.run());
};

function setupEnvironment(command, options) {
  if (typeof command.getEnv === 'function') {
    process.env.BROCCOLI_ENV = command.getEnv(options) || 'development';
  }
}

Cli.prototype.runCurrentCommand = function() {
  var cmd = this.cmd;
  cmd = commandAliases[cmd] ? commandAliases[cmd] : cmd;
  var action = this.commands[cmd];

  if (cmd && !action) {
    this.ui.write('The specified command ' + chalk.underline(cmd) + ' is invalid, for available options see `ember help`\n\n');
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

  setupEnvironment(action, options);
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

  return this.runCurrentCommand();
};
