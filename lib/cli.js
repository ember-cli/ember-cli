'use strict';

var nopt = require('nopt');
var chalk = require('chalk');
var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var Insight = require('./utilities/insight');
var merge = require('lodash-node/modern/objects/merge');
var path = require('path');
var pkg = require('../package.json');
var ui = require('./ui');
var fs = require('fs');
var denodeify = RSVP.denodeify;
var readFile = denodeify(fs.readFile);
var sequence = require('./utilities/sequence');

RSVP.on('error', function(error) {
  ui.write(chalk.red(String(error)) + '\n');
  // throw error;
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

function Cli(argv, commands, ui, insight) {
  this.argv = argv;
  this.opts = nopt(types, shorthands, argv);
  this.cmd = this.opts.argv.remain[0];
  this.commands = commands;
  this.insight = insight;

  this.ui = ui;
}

module.exports = Cli;

function loadInsight() {
  return new Insight({
    trackingCode: 'UA-49225444-1',
    packageName: pkg.name,
    packageVersion: pkg.version
  });
}

function readDefaults() {
  var defaultsPath = path.join(process.cwd(), '.ember-cli');
  return readFile(defaultsPath).then(function(content) {
    return content.toString().split(' ');
  }).catch(function() { });
}


Cli.run = function run (argv, ui, insight) {
  var commands = require('../lib/commands/commands');

  ui = ui || require('./ui');
  insight = insight || loadInsight();

  var cli = new Cli(argv, commands, ui, insight);
  var permission = insight.askPermission();

  return sequence([
    permission,
    readDefaults,
    cli.run.bind(cli)
  ]);
};

function collectArgs(args, options) {
  return JSON.stringify(args.concat([options]));
}

function setupEnvironment(command, options) {
  if (typeof command.getEnv === 'function') {
    process.env.BROCCOLI_ENV = command.getEnv(options) || 'development';
  }
}

Cli.prototype.runCurrentCommand = function(defaults) {
  var cmd = this.cmd;
  cmd = commandAliases[cmd] ? commandAliases[cmd] : cmd;
  var action = this.commands[cmd];

  this.insight.track('ember', cmd);

  if (cmd && !action) {
    this.ui.write('The specified command ' + chalk.underline(cmd) + ' is invalid, for available options see `ember help`\n\n');
    return;
  }

  if (!action) {
    action = this.commands.help;
  }

  var parseOpts = nopt.bind(null, action.types, action.shorthands);
  var opts = parseOpts(this.argv);

  if(defaults !== undefined) {
    defaults = nopt(action.types, action.shorthands, defaults, 0);
  } else {
    defaults = {};
  }

  var options = merge({}, opts, defaults, {
    appRoot: process.cwd(),
    cliRoot: path.resolve(path.join(__dirname, '..'))
  });

  var args = options.argv.remain.slice();

  args.shift(); // remove CMD

  setupEnvironment(action, options);

  this.insight.track(collectArgs(args, options));

  return action.run({
    args: args,
    cliOptions: options
  }, this.ui);

};

Cli.prototype.run = function(defaults) {
  var opts = this.opts;
  var cli = this;

  if (opts.version) {
    this.ui.write('ember-cli ' + pkg.version + '\n');
    return 0;
  } else if (opts.help) {
    this.cmd = 'help';
  }

  return new Promise(function(resolve) {
    resolve(cli.runCurrentCommand(defaults));
  }).catch(function(err) {
    // Log it if it's just a string. Else if it's a real error, throw.
    if (typeof err === 'string') { cli.ui.write(err); }
    else { throw err; }
  });
};
