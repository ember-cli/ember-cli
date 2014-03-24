'use strict';

var assert = require('../helpers/assert');
var stub = require('../helpers/stub');
var MockUI = require('../helpers/mock-ui');
var Insight = require('../../lib/utilities/insight');
var Cli = require('../../lib/cli');
var baseArgs = ['node', 'path/to/cli'];
var extend = require('lodash-node/compat/objects/assign');
var brocEnv = require('broccoli-env');

var ui;
var commands;
var insight;
var argv;
// helper to similate running the CLI
function ember(args) {
  var argv;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  return new Cli(argv, commands, ui, insight).run();
}

function stubCommand(name) {
  var mod;
  try {
    // deep clone
    mod = extend({}, require('../../lib/commands/' + name));
  } catch(e) { }
  commands[name] = mod || {};
  return stub(commands[name], 'run');
}

function stubInsight() {
  insight = new Insight({
    trackingCode: 'test',
    packageName: 'test'
  });

  stub(insight, 'track');
  stub(insight, 'askPermission').asPromise();

  return insight;

}

beforeEach(function() {
  ui = new MockUI();
  stubInsight();
  argv = [];
  commands = {};
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

describe('Unit: CLI', function(){
  it('exists', function(){
    assert(Cli);
  });

  it('ember', function(){
    var help = stubCommand('help');

    ember();

    assert.equal(help.called, 1, 'expected help to be called once');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it('ember --version', function(){
    ember(['--version']);
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
  });

  it('ember -v', function(){
    ember(['-v']);
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
  });

  it('ember --help', function(){
    var help = stubCommand('help');

    ember(['--help']);

    assert.equal(help.called, 1, 'expected the help command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it('ember -h', function(){
    var help = stubCommand('help');

    ember(['-h']);

    assert.equal(help.called, 1, 'expected the help command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it('ember --help --version', function(){
    var help = stubCommand('help');

    ember(['--version', '--help']);

    // --version takes priority
    assert.equal(help.called, 0, 'expected the help command to be run');
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
    assert.deepEqual(ui.output.length, 1, 'expected one line of output');
  });

  ['server','s'].forEach(function(command) {
    it('ember ' + command + ' --port 9999', function(){
      var server = stubCommand('server');

      ember([command, '--port',  '9999']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.port, 9999, 'correct port');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' -p 9999', function(){
      var server = stubCommand('server');

      ember([command, '-p',  '9999']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.port, 9999, 'correct port');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' --host localhost', function(){
      var server = stubCommand('server');

      ember(['server', '--host', 'localhost']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.host, 'localhost', 'correct localhost');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' --port 9292 --host localhost', function(){
      var server = stubCommand('server');

      ember([command, '--port', '9292',  '--host',  'localhost']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.host, 'localhost', 'correct localhost');
      assert.equal(options.port, '9292', 'correct localhost');
      assert.deepEqual(ui.output.length, 0, 'expected no lines of output');
    });

    it('ember ' + command + ' --environment <environment>', function(){
      var server = stubCommand('server');

      ember([command, '--environment', 'production']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.environment, 'production', 'correct environment');
      assert.equal(brocEnv.getEnv(), 'production', 'expect broccoli env to be changed to production');
    });

    it('ember ' + command + ' --env <environment>', function(){
      var server = stubCommand('server');

      ember([command, '--env', 'production']);

      var options = server.calledWith[0][0].options;

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(options.environment, 'production', 'correct environment');
      assert.equal(brocEnv.getEnv(), 'production', 'expect broccoli env to be changed to production');
    });

  });

  ['generate', 'g'].forEach(function(command) {
    it('ember ' + command + ' foo bar baz', function(){
      var generate = stubCommand('generate');
      var called;

      ember([command, 'foo', 'bar', 'baz']);

      called = generate.calledWith[0][0];

      assert.equal(generate.called, 1, 'expected the generate command to be run');
      assert.deepEqual(called.args, ['foo', 'bar', 'baz']);
      assert.deepEqual(ui.output.length, 0, 'expected no lines of output');
    });
  });

  ['init', 'i'].forEach(function(command) {
    it('ember ' + command, function(){
      var init = stubCommand('init');

      ember([command]);

      assert.equal(init.called, 1, 'expected the init command to be run');
      assert.equal(ui.output.length, 0, 'expected no output');
    });

    it('ember ' + command + ' <app-name>', function(){
      var init = stubCommand('init');

      ember([command, 'my-blog']);

      var options = init.calledWith[0][0];

      assert.equal(init.called, 1, 'expected the init command to be run');
      assert.deepEqual(options.args, ['my-blog'], 'expect first arg to be the app name');
      assert.equal(ui.output.length, 0, 'expected no output');
    });
  });

  it('ember new', function(){
    var newCommand = stubCommand('new');

    ember(['new']);

    assert.equal(newCommand.called, 1, 'expected the new command to be run');
  });

  it('ember new MyApp', function(){
    var newCommand = stubCommand('new');

    ember(['new', 'MyApp']);

    assert.equal(newCommand.called, 1, 'expected the new command to be run');
  });

  it('ember build', function(){
    var build = stubCommand('build');

    ember(['build']);

    assert.equal(build.called, 1, 'expected the build command to be run');
    assert.equal(brocEnv.getEnv(), 'development', 'expect broccoli env to be changed to development');
  });

  it('ember build <environment>', function(){
    var build = stubCommand('build');

    ember(['build', 'production']);

    var options = build.calledWith[0][0];

    assert.equal(build.called, 1, 'expected the build command to be run');
    assert.deepEqual(options.args, ['production'], 'expect first arg to be the production environment');
    assert.equal(brocEnv.getEnv(), 'production', 'expect broccoli env to be changed to production');
  });

  it('ember <valid command>', function(){
    var help = stubCommand('help');
    var foo = stubCommand('foo');

    ember(['foo']);

    assert.equal(help.called, 0, 'expected the help command NOT to be run');
    assert.equal(foo.called, 1,  'expected the foo command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it('ember <valid command with args>', function(){
    var help = stubCommand('help');
    var foo = stubCommand('foo');

    ember(['foo', 'lorem', 'ipsum', 'dolor', '--flag1=one']);

    var options = foo.calledWith[0][0];

    assert.equal(help.called, 0, 'expected the help command NOT to be run');
    assert.equal(foo.called, 1,  'expected the foo command to be run');
    assert.deepEqual(options.args, ['lorem', 'ipsum', 'dolor'], 'expects correct arguments');

    assert.equal(foo.calledWith[0].length, 2, 'expect foo to receive a total of 4 args');
    assert.equal(options.options.flag1, 'one', 'expect foo to receive the flag1 with the string one');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it('ember <invalid command>', function(){
    var help = stubCommand('help');
    var foo = stubCommand('foo');

    ember(['unknownCommand']);

    assert(/The specified command .*unknownCommand.* is invalid/.test(ui.output[0]), 'expected an invalid command message');
    assert.equal(foo.called, 0, 'exptected the foo command no to be run');
    assert.equal(help.called, 0, 'expected the help command to be run');
  });

  describe('analytics tracking', function() {

    var track;

    beforeEach(function() {
      track = stub(insight, 'track');
      stubCommand(['build']);
    });

    afterEach(function() {
      insight.track.restore();
    });

    it('tracks the command that was run', function() {

      ember(['build']);

      assert.ok(track.called);
      assert.equal(track.calledWith[0][0], 'ember');
      assert.equal(track.calledWith[0][1], 'build');
    });

    it('tracks given options as JSON string', function() {
      ember(['build', 'production', '--output', '/blah']);

      var args = JSON.parse(track.calledWith[1][0]);
      assert.ok(track.called);
      assert.equal(args[0], 'production');
      assert.equal(args[1].output, '/blah');
    });

    describe('prompting for permission', function() {
      beforeEach(function() {
        insight.askPermission.restore();
      });

      it('asks when optOut is not set', function() {
        insight.optOut = undefined;
        var askPermission = stub(insight.insight, 'askPermission').asPromise();
        Cli.run([], ui, insight);
        assert.ok(askPermission.called);
      });

      it('does not ask when optOut is set', function() {
        insight.optOut = false;
        var askPermission = stub(insight.insight, 'askPermission').asPromise();
        Cli.run([], ui, insight);
        assert.notOk(askPermission.called);
      });
    });

  });
});
