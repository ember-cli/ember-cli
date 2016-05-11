'use strict';

var EOL           = require('os').EOL;
var expect        = require('chai').expect;
var stub          = require('../../helpers/stub');
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var CLI           = require('../../../lib/cli/cli');

var safeRestore = stub.safeRestore;
stub = stub.stub;

var ui;
var analytics;
var commands = {};
var argv;
var isWithinProject;

// helper to similate running the CLI
function ember(args) {
  return new CLI({
    ui: ui,
    analytics: analytics,
    testing: true
  }).run({
    tasks:    {},
    commands: commands,
    cliArgs:  args || [],
    settings: {},
    project: {
      isEmberCLIProject: function() {  // similate being inside or outside of a project
        return isWithinProject;
      },
      hasDependencies: function() {
        return true;
      },
      blueprintLookupPaths: function() {
        return [];
      }
    }
  });
}

function stubCallHelp() {
  return stub(CLI.prototype, 'callHelp');
}

function stubValidateAndRunHelp(name) {
  commands[name] = require('../../../lib/commands/' + name);
  return stub(commands[name].prototype, 'validateAndRun', 'callHelp');
}

function stubValidateAndRun(name) {
  commands[name] = require('../../../lib/commands/' + name);
  return stub(commands[name].prototype, 'validateAndRun');
}

function stubRun(name) {
  commands[name] = require('../../../lib/commands/' + name);
  return stub(commands[name].prototype, 'run');
}

beforeEach(function() {
  ui = new MockUI();
  analytics = new MockAnalytics();
  argv = [];
  commands = { };
  isWithinProject = true;
});

afterEach(function() {
  for (var key in commands) {
    if (!commands.hasOwnProperty(key)) { continue; }
    safeRestore(commands[key].prototype, 'validateAndRun');
    safeRestore(commands[key].prototype, 'run');
  }

  delete process.env.EMBER_ENV;
  commands = argv = ui = undefined;
});

describe('Unit: CLI', function() {
  this.timeout(10000);
  it('exists', function() {
    expect(CLI).to.be.ok;
  });

  it('ember', function() {
    var help = stubValidateAndRun('help');

    return ember().then(function() {
      expect(help.called).to.equal(1, 'expected help to be called once');
      var output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });
/*
  it('logError', function() {
    var cli = new CLI({
      ui: ui,
      analytics: analytics,
      testing: true
    });
    var error = new Error('Error message!');
    var expected = {exitCode: 1, ui: ui, error: error};
    expect(cli.logError(error)).to.eql(expected, 'expected error object');
  });
*/
  it('callHelp', function() {
    var cli = new CLI({
      ui: ui,
      analytics: analytics,
      testing: true
    });
    var init = stubValidateAndRun('init');
    var help = stubValidateAndRun('help');
    var helpOptions = {
      environment: {
        tasks:    {},
        commands: commands,
        cliArgs: [],
        settings: {},
        project: {
          isEmberCLIProject: function() {  // similate being inside or outside of a project
            return isWithinProject;
          },
          hasDependencies: function() {
            return true;
          },
          blueprintLookupPaths: function() {
            return [];
          }
        }
      },
      commandName: 'init',
      commandArgs: []
    };
    cli.callHelp(helpOptions);
    expect(help.called).to.equal(1, 'expected help to be called once');
    expect(init.called).to.equal(0, 'expected init not to be called');
  });

  describe('help', function() {
    ['--help', '-h'].forEach(function(command) {
      it('ember ' + command, function() {
        var help = stubValidateAndRun('help');

        return ember([command]).then(function() {
          expect(help.called).to.equal(1, 'expected help to be called once');
          var output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });

      it('ember new ' + command, function() {
        var help = stubCallHelp();
        var newCommand = stubValidateAndRunHelp('new');

        return ember(['new', command]).then(function() {
          expect(help.called).to.equal(1, 'expected help to be called once');
          var output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');

          expect(newCommand.called).to.equal(1, 'expected the new command to be called once');
        });
      });
    });
  });

  ['--version', '-v'].forEach(function(command) {
    it('ember ' + command, function() {
      var version = stubValidateAndRun('version');

      return ember([command]).then(function() {
        var output = ui.output.trim();
        expect(output).to.equal('', 'expected no extra output');
        expect(version.called).to.equal(1, 'expected version to be called once');
      });
    });
  });

  describe('server', function() {
    ['server','s'].forEach(function(command) {
      it('ember ' + command + ' --port 9999', function() {
        var server = stubRun('serve');

        return ember([command, '--port',  '9999']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.port).to.equal(9999, 'expected port 9999, was ' + options.port);
        });
      });

      it('ember ' + command + ' --host localhost', function() {
        var server = stubRun('serve');

        return ember(['server', '--host', 'localhost']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.host).to.equal('localhost', 'correct localhost');
        });
      });

      it('ember ' + command + ' --port 9292 --host localhost', function() {
        var server = stubRun('serve');

        return ember([command, '--port', '9292',  '--host',  'localhost']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.host).to.equal('localhost', 'correct localhost');
          expect(options.port).to.equal(9292, 'correct port');
        });
      });

      it('ember ' + command + ' --proxy http://localhost:3000/', function() {
        var server = stubRun('serve');

        return ember([command, '--proxy', 'http://localhost:3000/']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.proxy).to.equal('http://localhost:3000/', 'correct proxy url');
        });
      });

      it('ember ' + command + ' --proxy https://localhost:3009/ --insecure-proxy', function () {
        var server = stubRun('serve');

        return ember([command, '--insecure-proxy']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.insecureProxy).to.equal(true, 'correct `secure` option for http-proxy');
        });
      });

      it('ember ' + command + ' --proxy https://localhost:3009/ --no-insecure-proxy', function () {
        var server = stubRun('serve');

        return ember([command, '--no-insecure-proxy']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.insecureProxy).to.equal(false, 'correct `secure` option for http-proxy');
        });
      });

      it('ember ' + command + ' --watcher events', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'events']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(/node|events|watchman/.test(options.watcher), 'correct watcher type').to.be.true;
        });
      });

      it('ember ' + command + ' --watcher polling', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'polling']).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(options.watcher).to.equal('polling', 'correct watcher type');
        });
      });

      it('ember ' + command, function() {
        var server = stubRun('serve');

        return ember([command]).then(function() {
          expect(server.called).to.equal(1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          expect(/node|events|watchman/.test(options.watcher), 'correct watcher type').to.be.true;
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');

          return ember([command, '--environment', env]).then(function() {
            expect(server.called).to.equal(1, 'expected the server command to be run');

            var options = server.calledWith[0][0];

            expect(options.environment).to.equal(env, 'correct environment');
          });
        });
      });

      ['development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');
          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            expect(server.called).to.equal(1, 'expected the server command to be run');

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('EMBER_ENV=' + env + ' ember ' + command, function() {
          var server = stubRun('serve');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            expect(server.called).to.equal(1, 'expected the server command to be run');

            expect(process.env.EMBER_ENV).to.equal(env, 'correct environment');
          });
        });
      });
    });
  });

  describe('generate', function() {
    ['generate', 'g'].forEach(function(command) {
      it('ember ' + command + ' foo bar baz', function() {
        var generate = stubRun('generate');

        return ember([command, 'foo', 'bar', 'baz']).then(function() {
          expect(generate.called).to.equal(1, 'expected the generate command to be run');

          var args = generate.calledWith[0][1];

          expect(args).to.deep.equal(['foo', 'bar', 'baz']);

          var output = ui.output.trim();

          var options = generate.calledWith[0][0];
          if (/win\d+/.test(process.platform) || options.watcher === 'watchman') {
            expect(output).to.equal('', 'expected no extra output');
          } else {
            expect(output.split(EOL).length).to.equal(2, 'expected no extra output');
          }
        });
      });
    });
  });

  describe('init', function() {
    ['init'].forEach(function(command) {
      it('ember ' + command, function() {
        var init = stubValidateAndRun('init');

        return ember([command]).then(function() {
          expect(init.called).to.equal(1, 'expected the init command to be run');
        });
      });

      it('ember ' + command + ' <app-name>', function() {
        var init = stubRun('init');

        return ember([command, 'my-blog']).then(function() {
          var args = init.calledWith[0][1];

          expect(init.called).to.equal(1, 'expected the init command to be run');
          expect(args).to.deep.equal(['my-blog'], 'expect first arg to be the app name');

          var output = ui.output.trim();

          var options = init.calledWith[0][0];
          if (/win\d+/.test(process.platform) || options.watcher === 'watchman') {
            expect(output).to.equal('', 'expected no extra output');
          } else {
            expect(output.split(EOL).length).to.equal(2, 'expected no extra output');
          }
        });
      });
    });
  });

  describe('new', function() {
    it('ember new', function() {
      isWithinProject = false;

      var newCommand = stubRun('new');

      return ember(['new']).then(function() {
        expect(newCommand.called).to.equal(1, 'expected the new command to be run');
      });
    });

    it('ember new MyApp', function() {
      isWithinProject = false;

      var newCommand = stubRun('new');

      return ember(['new', 'MyApp']).then(function() {
        expect(newCommand.called).to.equal(1, 'expected the new command to be run');
        var args = newCommand.calledWith[0][1];

        expect(args).to.deep.equal(['MyApp']);
      });
    });
  });

  describe('build', function() {
    ['build','b'].forEach(function(command) {
      it('ember ' + command, function() {
        var build = stubRun('build');

        return ember([command]).then(function() {
          expect(build.called).to.equal(1, 'expected the build command to be run');

          var options = build.calledWith[0][0];
          expect(options.watch).to.equal(false, 'expected the default watch flag to be false');
          expect(options.suppressSizes).to.equal(false, 'expected the default supress-sizes flag to be false');
        });
      });

      it('ember ' + command + ' --disable-analytics', function() {
        var build = stubRun('build');

        return ember([command, '--disable-analytics']).then(function() {
          var options = build.calledWith[0][0];
          expect(options.disableAnalytics).to.equal(true, 'expected the disableAnalytics flag to be true');
        });
      });

      it('ember ' + command + ' --watch', function() {
        var build = stubRun('build');

        return ember([command, '--watch']).then(function() {
          var options = build.calledWith[0][0];
          expect(options.watch).to.equal(true, 'expected the watch flag to be true');
        });
      });

      it('ember ' + command + ' --suppress-sizes', function() {
        var build = stubRun('build');

        return ember([command, '--suppress-sizes']).then(function () {
          var options = build.calledWith[0][0];
          expect(options.suppressSizes).to.equal(true, 'expected the suppressSizes flag to be true');
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var build = stubRun('build');

          return ember([command, '--environment', env]).then(function() {
            expect(build.called).to.equal(1, 'expected the build command to be run');

            var options = build.calledWith[0][0];

            expect(options.environment).to.equal(env, 'correct environment');
          });
        });
      });

      ['development', 'baz'].forEach(function(env) {
        it('EMBER_ENV=production ember ' + command + ' --environment ' + env, function() {
          var build = stubRun('build');

          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            expect(build.called).to.equal(1, 'expected the build command to be run');

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it('EMBER_ENV=' + env + ' ember ' + command + ' ', function() {
          var build = stubRun('build');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            expect(build.called).to.equal(1, 'expected the build command to be run');

            expect(process.env.EMBER_ENV).to.equal(env, 'correct environment');
          });
        });
      });
    });
  });

  it('ember <valid command>', function() {
    var help = stubValidateAndRun('help');
    var serve = stubValidateAndRun('serve');

    return ember(['serve']).then(function() {
      expect(help.called).to.equal(0, 'expected the help command NOT to be run');
      expect(serve.called).to.equal(1, 'expected the serve command to be run');

      var output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it.skip('ember <valid command with args>', function() {
    var help = stubValidateAndRun('help');
    var serve = stubValidateAndRun('serve');

    return ember(['serve', 'lorem', 'ipsum', 'dolor', '--flag1=one']).then(function() {
      var args = serve.calledWith[0][0].cliArgs;

      expect(help.called).to.equal(0, 'expected the help command NOT to be run');
      expect(serve.called).to.equal(1, 'expected the foo command to be run');
      expect(args).to.deep.equal(['serve', 'lorem', 'ipsum', 'dolor'], 'expects correct arguments');

      expect(serve.calledWith[0].length).to.equal(2, 'expect foo to receive a total of 4 args');

      var output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it('ember <invalid command>', function() {
    var help = stubValidateAndRun('help');

    return ember(['unknownCommand']).then(function() {
      expect(false).to.be.ok;
    }).catch(function(error) {
      expect(help.called, 'help command was executed').to.not.be.ok;
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('The specified command unknownCommand is invalid. For available options, see `ember help`.');
    });
  });

  describe.skip('default options config file', function() {
    it('reads default options from .ember-cli file', function() {
      var defaults = ['--output', process.cwd()];
      var build = stubValidateAndRun('build');

      return ember(['build'], defaults).then(function() {

        var options = build.calledWith[0][1].cliOptions;

        expect(options.output).to.equal(process.cwd());
      });
    });
  });

  describe('logError', function() {
    it('returns error status code in production', function() {
      var cli = new CLI({
        ui: new MockUI(),
        testing: false
      });

      expect(cli.logError('foo')).to.equal(1);
    });

    it('does not throw an error in production', function() {
      var cli = new CLI({
        ui: new MockUI(),
        testing: false
      });

      var invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.not.throw();
    });

    it('throws error in testing', function() {
      var cli = new CLI({
        ui: new MockUI(),
        testing: true
      });

      var invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.throw(Error, 'foo');
    });
  });

  describe('Global command options', function() {
    var verboseCommand = function(args) {
      return ember(['fake-command', '--verbose'].concat(args));
    };

    describe('--verbose', function() {
      describe('option parsing', function() {
        afterEach(function() {
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_1;
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_2;
        });

        it('sets process.env.EMBER_VERBOSE_${NAME} for each space delimited option', function() {
          return verboseCommand(['fake_option_1', 'fake_option_2']).then(function() {
            expect(false).to.be.true;
          }).catch(function(error) {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });

        it('ignores verbose options after --', function() {
          return verboseCommand(['fake_option_1', '--fake-option', 'fake_option_2']).then(function() {
            expect(false).to.be.true;
          }).catch(function(error) {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });

        it('ignores verbose options after -', function() {
          return verboseCommand(['fake_option_1', '-f', 'fake_option_2']).then(function() {
            expect(false).to.be.true;
          }).catch(function(error) {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });
      });
    });
  });
});
