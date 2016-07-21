'use strict';

var EOL           = require('os').EOL;
var expect        = require('chai').expect;
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var CLI           = require('../../../lib/cli/cli');
var td = require('testdouble');

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
  return td.replace(CLI.prototype, 'callHelp', td.function());
}

function stubValidateAndRunHelp(name) {
  var stub = stubValidateAndRun(name);
  td.when(stub(), {ignoreExtraArgs: true}).thenReturn('callHelp');
  return stub;
}

function stubValidateAndRun(name) {
  commands[name] = require('../../../lib/commands/' + name);
  return td.replace(commands[name].prototype, 'validateAndRun', td.function());
}

function stubRun(name) {
  commands[name] = require('../../../lib/commands/' + name);
  return td.replace(commands[name].prototype, 'run', td.function());
}

beforeEach(function() {
  ui = new MockUI();
  analytics = new MockAnalytics();
  argv = [];
  commands = { };
  isWithinProject = true;
});

afterEach(function() {
  td.reset();

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
      td.verify(help(), {ignoreExtraArgs: true, times: 1});
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
    td.verify(help(), {ignoreExtraArgs: true, times: 1});
    td.verify(init(), {ignoreExtraArgs: true, times: 0});
  });

  describe('help', function() {
    ['--help', '-h'].forEach(function(command) {
      it('ember ' + command, function() {
        var help = stubValidateAndRun('help');

        return ember([command]).then(function() {
          td.verify(help(), {ignoreExtraArgs: true, times: 1});
          var output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });

      it('ember new ' + command, function() {
        var help = stubCallHelp();
        var newCommand = stubValidateAndRunHelp('new');

        return ember(['new', command]).then(function() {
          td.verify(help(), {ignoreExtraArgs: true, times: 1});
          var output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');

          td.verify(newCommand(), {ignoreExtraArgs: true, times: 1});
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
        td.verify(version(), {ignoreExtraArgs: true, times: 1});
      });
    });
  });

  describe('server', function() {
    ['server','s'].forEach(function(command) {
      it('ember ' + command + ' --port 9999', function() {
        var server = stubRun('serve');

        return ember([command, '--port',  '9999']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.port, 'port').to.equal(9999);
        });
      });

      it('ember ' + command + ' --host localhost', function() {
        var server = stubRun('serve');

        return ember(['server', '--host', 'localhost']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.host, 'host').to.equal('localhost');
        });
      });

      it('ember ' + command + ' --port 9292 --host localhost', function() {
        var server = stubRun('serve');

        return ember([command, '--port', '9292',  '--host',  'localhost']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.host, 'host').to.equal('localhost');
          expect(captor.value.port, 'port').to.equal(9292);
        });
      });

      it('ember ' + command + ' --proxy http://localhost:3000/', function() {
        var server = stubRun('serve');

        return ember([command, '--proxy', 'http://localhost:3000/']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.proxy, 'proxy').to.equal('http://localhost:3000/');
        });
      });

      it('ember ' + command + ' --proxy https://localhost:3009/ --insecure-proxy', function () {
        var server = stubRun('serve');

        return ember([command, '--insecure-proxy']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.insecureProxy, 'insecureProxy').to.equal(true);
        });
      });

      it('ember ' + command + ' --proxy https://localhost:3009/ --no-insecure-proxy', function () {
        var server = stubRun('serve');

        return ember([command, '--no-insecure-proxy']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.insecureProxy, 'insecureProxy').to.equal(false);
        });
      });

      it('ember ' + command + ' --watcher events', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'events']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.watcher, 'watcher').to.match(/node|polling|watchman/);
        });
      });

      it('ember ' + command + ' --watcher polling', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'polling']).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.watcher, 'watcher').to.equal('polling');
        });
      });

      it('ember ' + command, function() {
        var server = stubRun('serve');

        return ember([command]).then(function() {
          var captor = td.matchers.captor();
          td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
          expect(captor.value.watcher, 'watcher').to.match(/node|polling|watchman/);
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');

          return ember([command, '--environment', env]).then(function() {
            var captor = td.matchers.captor();
            td.verify(server(captor.capture()), {ignoreExtraArgs: true, times: 1});
            expect(captor.value.environment, 'environment').to.equal(env);
          });
        });
      });

      ['development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');
          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            td.verify(server(), {ignoreExtraArgs: true, times: 1});

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('EMBER_ENV=' + env + ' ember ' + command, function() {
          var server = stubRun('serve');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            td.verify(server(), {ignoreExtraArgs: true, times: 1});

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
          var captor = td.matchers.captor();
          td.verify(generate(captor.capture(), ['foo', 'bar', 'baz']), {times: 1});

          var output = ui.output.trim();

          var options = captor.value;
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
          td.verify(init(), {ignoreExtraArgs: true, times: 1});
        });
      });

      it('ember ' + command + ' <app-name>', function() {
        var init = stubRun('init');

        return ember([command, 'my-blog']).then(function() {
          var captor = td.matchers.captor();
          td.verify(init(captor.capture(), ['my-blog']), {times: 1});

          var output = ui.output.trim();

          var options = captor.value;
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
        td.verify(newCommand(), {ignoreExtraArgs: true, times: 1});
      });
    });

    it('ember new MyApp', function() {
      isWithinProject = false;

      var newCommand = stubRun('new');

      return ember(['new', 'MyApp']).then(function() {
        td.verify(newCommand(td.matchers.anything(), ['MyApp']), {times: 1});
      });
    });
  });

  describe('build', function() {
    ['build','b'].forEach(function(command) {
      it('ember ' + command, function() {
        var build = stubRun('build');

        return ember([command]).then(function() {
          var captor = td.matchers.captor();
          td.verify(build(captor.capture()), {ignoreExtraArgs: true, times: 1});

          var options = captor.value;
          expect(options.watch).to.equal(false, 'expected the default watch flag to be false');
          expect(options.suppressSizes).to.equal(false, 'expected the default supress-sizes flag to be false');
        });
      });

      it('ember ' + command + ' --disable-analytics', function() {
        var build = stubRun('build');

        return ember([command, '--disable-analytics']).then(function() {
          var captor = td.matchers.captor();
          td.verify(build(captor.capture()), {ignoreExtraArgs: true, times: 1});

          var options = captor.value;
          expect(options.disableAnalytics).to.equal(true, 'expected the disableAnalytics flag to be true');
        });
      });

      it('ember ' + command + ' --watch', function() {
        var build = stubRun('build');

        return ember([command, '--watch']).then(function() {
          var captor = td.matchers.captor();
          td.verify(build(captor.capture()), {ignoreExtraArgs: true, times: 1});

          var options = captor.value;
          expect(options.watch).to.equal(true, 'expected the watch flag to be true');
        });
      });

      it('ember ' + command + ' --suppress-sizes', function() {
        var build = stubRun('build');

        return ember([command, '--suppress-sizes']).then(function () {
          var captor = td.matchers.captor();
          td.verify(build(captor.capture()), {ignoreExtraArgs: true, times: 1});

          var options = captor.value;
          expect(options.suppressSizes).to.equal(true, 'expected the suppressSizes flag to be true');
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var build = stubRun('build');

          return ember([command, '--environment', env]).then(function() {
            var captor = td.matchers.captor();
            td.verify(build(captor.capture()), {ignoreExtraArgs: true, times: 1});

            var options = captor.value;
            expect(options.environment).to.equal(env, 'correct environment');
          });
        });
      });

      ['development', 'baz'].forEach(function(env) {
        it('EMBER_ENV=production ember ' + command + ' --environment ' + env, function() {
          var build = stubRun('build');

          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            td.verify(build(), {ignoreExtraArgs: true, times: 1});

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it('EMBER_ENV=' + env + ' ember ' + command + ' ', function() {
          var build = stubRun('build');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            td.verify(build(), {ignoreExtraArgs: true, times: 1});

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
      td.verify(help(), {ignoreExtraArgs: true, times: 0});
      td.verify(serve(), {ignoreExtraArgs: true, times: 1});

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
