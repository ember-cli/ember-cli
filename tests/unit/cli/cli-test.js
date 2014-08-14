'use strict';

var assert   = require('../../helpers/assert');
var stub     = require('../../helpers/stub').stub;
var MockUI   = require('../../helpers/mock-ui');
var MockAnalytics   = require('../../helpers/mock-analytics');
var CLI      = require('../../../lib/cli/cli');
var ui;
var analytics;
var commands;
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
      }
    }
  });
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
  for(var key in commands) {
    if (!commands.hasOwnProperty(key)) { continue; }
    if (commands[key].prototype.validateAndRun.restore) {
      commands[key].prototype.validateAndRun.restore();
    }
    if (commands[key].prototype.run.restore) {
      commands[key].prototype.run.restore();
    }
  }

  delete process.env.EMBER_ENV;
  commands = argv = ui = undefined;
});

function assertVersion(string, message) {
  assert(/version:\s\d+\.\d+\.\d+/.test(string), message ||
         ('expected version, got: ' + string));
}

describe('Unit: CLI', function() {
  it('exists', function() {
    assert(CLI);
  });

  it('ember', function() {
    var help = stubValidateAndRun('help');

    return ember().then(function() {
      assert.equal(help.called, 1, 'expected help to be called once');
      var output = ui.output.trim().split('\n');
      assertVersion(output[0]);
      assert.equal(output.length, 1, 'expected no extra output');
    });
  });

  describe('help', function(){
    ['--help', '-h'].forEach(function(command){
      it('ember ' + command, function() {
        var help = stubValidateAndRun('help');

        return ember([command]).then(function() {
          assert.equal(help.called, 1, 'expected help to be called once');
          var output = ui.output.trim().split('\n');
          assertVersion(output[0]);
          assert.equal(output.length, 1, 'expected no extra output');
        });
      });

      it('ember new ' + command, function() {
        var help = stubValidateAndRun('help');
        var newCommand = stubValidateAndRun('new');

        return ember(['new', command]).then(function() {
          assert.equal(help.called, 1, 'expected help to be called once');
          var output = ui.output.trim().split('\n');
          assertVersion(output[0]);
          assert.equal(output.length, 1, 'expected no extra output');

          assert.equal(newCommand.called, 0, 'expected the new command to never be called');
        });
      });
    });
  });

  ['--version', '-v'].forEach(function(command){
    it('ember ' + command, function() {
      var version = stubValidateAndRun('version');

      return ember([command]).then(function() {
        var output = ui.output.trim().split('\n');
        assertVersion(output[0]);
        assert.equal(output.length, 1, 'expected no extra output');
        assert.equal(version.called, 1, 'expected version to be called once');
      });
    });
  });

  describe('server', function() {
    ['server','s'].forEach(function(command) {
      it('expects version in UI output', function() {
        var server = stubRun('serve');

        return ember([command]).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var output = ui.output.trim().split('\n');
          assertVersion(output[0]);
          assert.deepEqual(output.length, 1, 'expected no extra of output');
        });
      });

      it('ember ' + command + ' --port 9999', function() {
        var server = stubRun('serve');

        return ember([command, '--port',  '9999']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.port, 9999, 'expected port 9999, was ' + options.port);
        });
      });

      it('ember ' + command + ' --host localhost', function() {
        var server = stubRun('serve');

        return ember(['server', '--host', 'localhost']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.host, 'localhost', 'correct localhost');
        });
      });

      it('ember ' + command + ' --port 9292 --host localhost', function() {
        var server = stubRun('serve');

        return ember([command, '--port', '9292',  '--host',  'localhost']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.host, 'localhost', 'correct localhost');
          assert.equal(options.port, '9292', 'correct localhost');
        });
      });

      it('ember ' + command + ' --proxy http://localhost:3000/', function() {
        var server = stubRun('serve');

        return ember([command, '--proxy', 'http://localhost:3000/']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.proxy, 'http://localhost:3000/', 'correct proxy url');
        });
      });

      it('ember ' + command + ' --watcher events', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'events']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.watcher, 'events', 'correct watcher type');
        });
      });

      it('ember ' + command + ' --watcher polling', function() {
        var server = stubRun('serve');

        return ember([command, '--watcher', 'polling']).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.watcher, 'polling', 'correct watcher type');
        });
      });

      it('ember ' + command, function() {
        var server = stubRun('serve');

        return ember([command]).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][0];

          assert.equal(options.watcher, 'events', 'correct watcher type');
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');

          return ember([command, '--environment', env]).then(function() {
            assert.equal(server.called, 1, 'expected the server command to be run');

            var options = server.calledWith[0][0];

            assert.equal(options.environment, env, 'correct environment');
          });
        });
      });

      ['development', 'foo'].forEach(function(env) {
        it('ember ' + command + ' --environment ' + env, function() {
          var server = stubRun('serve');
          process.env.EMBER_ENV='production';

          return ember([command, '--environment', env]).then(function() {
            assert.equal(server.called, 1, 'expected the server command to be run');

            assert.equal(process.env.EMBER_ENV, 'production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it('EMBER_ENV=' + env + ' ember ' + command, function() {
          var server = stubRun('serve');

          process.env.EMBER_ENV=env;

          return ember([command]).then(function() {
            assert.equal(server.called, 1, 'expected the server command to be run');

            assert.equal(process.env.EMBER_ENV, env, 'correct environment');
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
          assert.equal(generate.called, 1, 'expected the generate command to be run');

          var args = generate.calledWith[0][1];

          assert.deepEqual(args, ['foo', 'bar', 'baz']);

          var output = ui.output.trim().split('\n');
          assertVersion(output[0]);
          assert.equal(output.length, 1, 'expected no extra of output');
        });
      });
    });
  });

  describe('init', function() {
    ['init', 'i'].forEach(function(command) {
      it('ember ' + command, function() {
        var init = stubValidateAndRun('init');

        return ember([command]).then(function() {
          assert.equal(init.called, 1, 'expected the init command to be run');
        });
      });

      it('ember ' + command + ' <app-name>', function() {
        var init = stubRun('init');

        return ember([command, 'my-blog']).then(function() {
          var args = init.calledWith[0][1];

          assert.equal(init.called, 1, 'expected the init command to be run');
          assert.deepEqual(args, ['my-blog'], 'expect first arg to be the app name');

          var output = ui.output.trim().split('\n');
          assertVersion(output[0]);
          assert.equal(output.length, 1, 'expected no extra of output');
        });
      });
    });
  });

  describe('new', function() {
    it('ember new', function() {
      isWithinProject = false;

      var newCommand = stubRun('new');

      return ember(['new']).then(function() {
        assert.equal(newCommand.called, 1, 'expected the new command to be run');
      });
    });

    it('ember new MyApp', function() {
      isWithinProject = false;

      var newCommand = stubRun('new');

      return ember(['new', 'MyApp']).then(function() {
        assert.equal(newCommand.called, 1, 'expected the new command to be run');
        var args = newCommand.calledWith[0][1];

        assert.deepEqual(args, ['MyApp']);
      });
    });
  });

  describe('update', function() {
    it('ember update', function() {
      var update = stubRun('update');

      return ember(['update']).then(function() {
        assert.equal(update.called, 1, 'expected the update command to be run');
      });
    });
  });

  describe('build', function() {
    it('ember build', function() {
      var build = stubRun('build');

      return ember(['build']).then(function() {
        assert.equal(build.called, 1, 'expected the build command to be run');

        var options = build.calledWith[0][0];
        assert.equal(options.watch, false, 'expected the default watch flag to be false');
      });
    });

    it('ember build --watch', function() {
      var build = stubRun('build');

      return ember(['build', '--watch']).then(function() {
        var options = build.calledWith[0][0];
        assert.equal(options.watch, true, 'expected the watch flag to be true');
      });
    });

    ['production', 'development', 'baz'].forEach(function(env){
      it('ember build --environment ' + env, function() {
        var build = stubRun('build');

        return ember(['build', '--environment', env]).then(function() {
          assert.equal(build.called, 1, 'expected the build command to be run');

          var options = build.calledWith[0][0];

          assert.equal(options.environment, env, 'correct environment');
        });
      });
    });

    ['development', 'baz'].forEach(function(env){
      it('EMBER_ENV=production ember build --environment ' + env, function() {
        var build = stubRun('build');

        process.env.EMBER_ENV = 'production';

        return ember(['build', '--environment', env]).then(function() {
          assert.equal(build.called, 1, 'expected the build command to be run');

          assert.equal(process.env.EMBER_ENV, 'production', 'uses EMBER_ENV over environment');
        });
      });
    });

    ['production', 'development', 'baz'].forEach(function(env){
      it('EMBER_ENV=' + env + ' ember build ', function() {
        var build = stubRun('build');

        process.env.EMBER_ENV=env;

        return ember(['build']).then(function() {
          assert.equal(build.called, 1, 'expected the build command to be run');

          assert.equal(process.env.EMBER_ENV, env, 'correct environment');
        });
      });
    });
  });

  it('ember <valid command>', function() {
    var help = stubValidateAndRun('help');
    var serve = stubValidateAndRun('serve');

    return ember(['serve']).then(function() {
      assert.equal(help.called, 0, 'expected the help command NOT to be run');
      assert.equal(serve.called, 1,  'expected the serve command to be run');

      var output = ui.output.trim().split('\n');
      assertVersion(output[0]);
      assert.equal(output.length, 1, 'expected no extra output');
    });
  });

  it.skip('ember <valid command with args>', function() {
    var help = stubValidateAndRun('help');
    var serve = stubValidateAndRun('serve');

    return ember(['serve', 'lorem', 'ipsum', 'dolor', '--flag1=one']).then(function() {
      var args= serve.calledWith[0][0].cliArgs;

      assert.equal(help.called, 0, 'expected the help command NOT to be run');
      assert.equal(serve.called, 1,  'expected the foo command to be run');
      assert.deepEqual(args, ['serve', 'lorem', 'ipsum', 'dolor'], 'expects correct arguments');

      assert.equal(serve.calledWith[0].length, 2, 'expect foo to receive a total of 4 args');

      var output = ui.output.trim().split('\n');
      assertVersion(output[0]);
      assert.equal(output.length, 1, 'expected no extra output');
    });
  });

  it('ember <invalid command>', function() {
    var help = stubValidateAndRun('help');

    return ember(['unknownCommand']).then(function() {
      var output = ui.output.trim().split('\n');
      assert(/The specified command .*unknownCommand.* is invalid/.test(output[1]), 'expected an invalid command message');
      assert.equal(help.called, 0, 'expected the help command to be run');
    });
  });

  describe.skip('default options config file', function() {
    it('reads default options from .ember-cli file', function() {
      var defaults = ['--output', process.cwd()];
      var build = stubValidateAndRun('build');

      return ember(['build'], defaults).then(function() {

        var options = build.calledWith[0][1].cliOptions;

        assert.equal(options.output, process.cwd());
      });
    });
  });

  describe.skip('analytics tracking', function() {
    var track;

    beforeEach(function() {
      stubValidateAndRun(['build']);
    });

    it('tracks the command that was run', function() {

      return ember(['build']).then(function() {
        assert.ok(track.called);
        assert.equal(track.calledWith[0][1], 'ember');
        assert.equal(track.calledWith[0][2], 'build');
      });
    });

    it('tracks given options as JSON string', function() {
      return ember(['build', 'production', '--output', '/blah']).then(function() {

        var args = JSON.parse(track.calledWith[1][0]);

        assert.ok(track.called);
        assert.equal(args[0], 'production');
        assert.equal(args[1].output, '/blah');
      });
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
            assert(process.env.EMBER_VERBOSE_FAKE_OPTION_1,  'expected it to be true');
            assert(process.env.EMBER_VERBOSE_FAKE_OPTION_2,  'expected it to be true');
          });
        });

        it('ignores verbose options after --', function() {
          return verboseCommand(['fake_option_1', '--fake-option', 'fake_option_2']).then(function() {
            assert(process.env.EMBER_VERBOSE_FAKE_OPTION_1,  'expected it to be true');
            assert(!process.env.EMBER_VERBOSE_FAKE_OPTION_2,  'expected it to be false');
          });
        });

        it('ignores verbose options after -', function() {
          return verboseCommand(['fake_option_1', '-f', 'fake_option_2']).then(function() {
            assert(process.env.EMBER_VERBOSE_FAKE_OPTION_1,  'expected it to be true');
            assert(!process.env.EMBER_VERBOSE_FAKE_OPTION_2,  'expected it to be false');
          });
        });
      });
    });
  });
});
