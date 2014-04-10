'use strict';

var assert   = require('../helpers/assert');
var stub     = require('../helpers/stub').stub;
var MockUI   = require('../helpers/mock-ui');
var Insight  = require('../../lib/utilities/insight');
var CLI      = require('../../lib/cli/cli');
var extend   = require('lodash-node/compat/objects/assign');

var ui;
var commands;
var insight;
var argv;

var insideProject;
// helper to similate running the CLI
function ember(args) {
  return new CLI(ui).run({
    tasks:    {},
    commands: commands,
    cliArgs:  args || [],
    project:  insideProject // similate being inside or outside a project
  });
}

function stubCommand(name) {
  commands[name] = extend({}, require('../../lib/commands/' + name));
  return stub(commands[name], 'run');
}

function stubInsight() {
  insight = new Insight({
    trackingCode: 'test',
    packageName: 'test'
  });

  stub(insight, 'track');
  stub(insight, 'askPermission');

  return insight;

}

beforeEach(function() {
  ui = new MockUI();
  stubInsight();
  argv = [];
  commands = { };
  insideProject = true;
});

afterEach(function() {
  for(var key in commands) {
    if (!commands.hasOwnProperty(key)) { continue; }
    commands[key].run.restore();
  }

  insight.track.restore();
  delete process.env.BROCCOLI_ENV;
  commands = argv = ui = undefined;
});

describe('Unit: CLI', function() {
  it('exists', function() {
    assert(CLI);
  });

  it('ember', function() {
    var help = stubCommand('help');

    return ember().then(function() {
      assert.equal(help.called, 1, 'expected help to be called once');
      assert.deepEqual(ui.output, [], 'expected no output');
    });
  });

  ['--help', '-h'].forEach(function(command){
    it('ember ' + command, function() {
      var help = stubCommand('help');

      return ember([command]).then(function() {
        assert.equal(help.called, 1, 'expected help to be called once');
        assert.deepEqual(ui.output, [], 'expected no output');
      });
    });
  });

  it('ember -h', function() {
    var help = stubCommand('help');

    return ember(['-h']).then(function() {
      assert.equal(help.called, 1, 'expected help to be called once');
      assert.deepEqual(ui.output, [], 'expected no output');
    });
  });

  ['--version', '-v'].forEach(function(command){
    it('ember ' + command, function() {
      var version = stubCommand('version');

      return ember([command]).then(function() {
        assert.equal(version.called, 1, 'expected version to be called once');
      });
    });
  });

  ['server','s'].forEach(function(command) {
    it('ember ' + command + ' --port 9999', function() {
      var server = stubCommand('serve');

      return ember([command, '--port',  '9999']).then(function() {

        assert.equal(server.called, 1, 'expected the server command to be run');

        var options = server.calledWith[0][1];

        assert.equal(options.port, 9999, 'correct port');
        assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
      });
    });

    it('ember ' + command + ' -p 9999', function() {
      var server = stubCommand('serve');

      ember([command, '-p',  '9999']).then(function() {
        assert.equal(server.called, 1, 'expected the server command to be run');

        var options = server.calledWith[0][1];

        assert.equal(options.port, 9999, 'correct port');
        assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
      });
    });

    it('ember ' + command + ' --host localhost', function() {
      var server = stubCommand('serve');

      ember(['server', '--host', 'localhost']).then(function() {
        assert.equal(server.called, 1, 'expected the server command to be run');

        var options = server.calledWith[0][1];

        assert.equal(options.host, 'localhost', 'correct localhost');
        assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
      });
    });

    it('ember ' + command + ' --port 9292 --host localhost', function() {
      var server = stubCommand('serve');

      ember([command, '--port', '9292',  '--host',  'localhost']).then(function() {
        assert.equal(server.called, 1, 'expected the server command to be run');

        var options = server.calledWith[0][1];

        assert.equal(options.host, 'localhost', 'correct localhost');
        assert.equal(options.port, '9292', 'correct localhost');
        assert.deepEqual(ui.output.length, 0, 'expected no lines of output');
      });
    });

    ['production', 'development', 'foo'].forEach(function(env) {
      it('ember ' + command + ' --environment ' + env, function() {
        var server = stubCommand('serve');

        return ember([command, '--environment', env]).then(function() {
          assert.equal(server.called, 1, 'expected the server command to be run');

          var options = server.calledWith[0][1];

          assert.equal(options.environment, env, 'correct environment');
        });
      });
    });
  });

  ['generate', 'g'].forEach(function(command) {
    it.skip('ember ' + command + ' foo bar baz', function() {
      var generate = stubCommand('generate');

      return ember([command, 'foo', 'bar', 'baz']).then(function() {
        assert.equal(generate.called, 1, 'expected the generate command to be run');

        var args = generate.calledWith[0][0].cliArgs;

        assert.deepEqual(args, ['foo', 'bar', 'baz']);
        assert.deepEqual(ui.output.length, 0, 'expected no lines of output');
      });
    });
  });

  ['init', 'i'].forEach(function(command) {
    it('ember ' + command, function() {
      var init = stubCommand('init');

      return ember([command]).then(function() {

        assert.equal(init.called, 1, 'expected the init command to be run');
        assert.equal(ui.output.length, 0, 'expected no output');
      });
    });

    it.skip('ember ' + command + ' <app-name>', function() {
      var init = stubCommand('init');

      return ember([command, 'my-blog']).then(function() {

        var options = init.calledWith[0][0];

        assert.equal(init.called, 1, 'expected the init command to be run');
        assert.deepEqual(options.args, ['my-blog'], 'expect first arg to be the app name');
        assert.equal(ui.output.length, 0, 'expected no output');
      });
    });
  });

  it('ember new', function() {
    insideProject = false;

    var newCommand = stubCommand('new');

    return ember(['new']).then(function() {
      assert.equal(newCommand.called, 1, 'expected the new command to be run');
    });
  });

  it.skip('ember new MyApp', function() {
    insideProject = false;

    var newCommand = stubCommand('new');

    return ember(['new', 'MyApp']).then(function() {
      assert.equal(newCommand.called, 1, 'expected the new command to be run');
      var options = newCommand.calledWith[0][0];

      assert.equal(options.name, 'MyApp');
    });
  });

  it('ember build', function() {
    var build = stubCommand('build');

    return ember(['build']).then(function() {
      assert.equal(build.called, 1, 'expected the build command to be run');
    });
  });

  ['production', 'development', 'baz'].forEach(function(env){
    it.skip('ember build ' + env, function() {
      var build = stubCommand('build');

      return ember(['build', env]).then(function() {

        var options = build.calledWith[0][0];

        assert.equal(build.called, 1, 'expected the build command to be run');
        assert.deepEqual(options.args, ['production'], 'expect first arg to be the production environment');
      });
    });
  });

  it('ember <valid command>', function() {
    var help = stubCommand('help');
    var serve = stubCommand('serve');

    return ember(['serve']).then(function() {
      assert.equal(help.called, 0, 'expected the help command NOT to be run');
      assert.equal(serve.called, 1,  'expected the foo command to be run');
      assert.deepEqual(ui.output, [], 'expected no output');
    });
  });

  it.skip('ember <valid command with args>', function() {
    var help = stubCommand('help');
    var serve = stubCommand('serve');

    return ember(['serve', 'lorem', 'ipsum', 'dolor', '--flag1=one']).then(function() {
      var options = serve.calledWith[0][0];

      assert.equal(help.called, 0, 'expected the help command NOT to be run');
      assert.equal(serve.called, 1,  'expected the foo command to be run');
      assert.deepEqual(options.args, ['lorem', 'ipsum', 'dolor'], 'expects correct arguments');

      assert.equal(serve.calledWith[0].length, 2, 'expect foo to receive a total of 4 args');
      assert.equal(options.cliOptions.flag1, 'one', 'expect foo to receive the flag1 with the string one');
      assert.deepEqual(ui.output, [], 'expected no output');
    });
  });

  it('ember <invalid command>', function() {
    var help = stubCommand('help');

    return ember(['unknownCommand']).then(function() {

      assert(/The specified command .*unknownCommand.* is invalid/.test(ui.output[0]), 'expected an invalid command message');
      assert.equal(help.called, 0, 'expected the help command to be run');
    });
  });

  describe.skip('default options config file', function() {
    it('reads default options from .ember-cli file', function() {
      var defaults = ['--output', process.cwd()];
      var build = stubCommand('build');

      return ember(['build'], defaults).then(function() {

        var options = build.calledWith[0][0].cliOptions;

        assert.equal(options.output, process.cwd());
      });
    });
  });

  describe.skip('analytics tracking', function() {
    var track;

    beforeEach(function() {
      track = stub(insight, 'track');
      stubCommand(['build']);
    });

    afterEach(function() {
      insight.track.restore();
    });

    it('tracks the command that was run', function() {

      return ember(['build']).then(function() {
        assert.ok(track.called);
        assert.equal(track.calledWith[0][0], 'ember');
        assert.equal(track.calledWith[0][1], 'build');
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

    // describe('prompting for permission', function() {
    //   beforeEach(function() {
    //     insight.askPermission.restore();
    //   });

    //   it('asks when optOut is not set', function() {
    //     insight.optOut = undefined;
    //     var askPermission = stub(insight.insight, 'askPermission');
    //     Cli.run([], ui, insight).then(function() {
    //     assert.ok(askPermission.called);
    //   });

    //   it('does not ask when optOut is set', function() {
    //     insight.optOut = false;
    //     var askPermission = stub(insight.insight, 'askPermission');
    //     Cli.run([], ui, insight);
    //     assert.notOk(askPermission.called);
    //   });
    // });

  });
});
