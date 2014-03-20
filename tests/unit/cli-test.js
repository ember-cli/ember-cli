'use strict';

var assert = require('assert');
var stub = require('../helpers/stub');
var MockUI = require('../helpers/mock-ui');
var Cli = require('../../lib/cli');
var baseArgs = ['node', 'path/to/cli'];
var extend = require('lodash-node/compat/objects/assign');
var brocEnv = require('broccoli-env');

var ui;
var commands;
var argv;
// helper to similate running the CLI
function ember(args) {
  var argv;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  return new Cli(argv, commands, ui).run();
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

beforeEach(function() {
  ui = new MockUI();
  argv = [];
  commands = {};
});

afterEach(function() {
  for(var key in commands) {
    if (!commands.hasOwnProperty(key)) { continue; }
    commands[key].run.restore();
  }
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

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].port, 9999, 'correct port');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' -p 9999', function(){
      var server = stubCommand('server');

      ember([command, '-p',  '9999']);

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].port, 9999, 'correct port');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' --host localhost', function(){
      var server = stubCommand('server');

      ember(['server', '--host', 'localhost']);

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].host, 'localhost', 'correct localhost');
      assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
    });

    it('ember ' + command + ' --port 9292 --host localhost', function(){
      var server = stubCommand('server');

      ember([command, '--port', '9292',  '--host',  'localhost']);

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].host, 'localhost', 'correct localhost');
      assert.equal(server.calledWith[0][0].port, '9292', 'correct localhost');
      assert.deepEqual(ui.output.length, 0, 'expected no lines of output');
    });

    it('ember ' + command + ' --environment <environment>', function(){
      var server = stubCommand('server');

      ember([command, '--environment', 'production']);

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].environment, 'production', 'correct environment');
      assert.equal(brocEnv.getEnv(), 'production', 'expect broccoli env to be changed to production');
    });

    it('ember ' + command + ' --env <environment>', function(){
      var server = stubCommand('server');

      ember([command, '--env', 'production']);

      assert.equal(server.called, 1, 'expected the server command to be run');
      assert.equal(server.calledWith[0][0].environment, 'production', 'correct environment');
      assert.equal(brocEnv.getEnv(), 'production', 'expect broccoli env to be changed to production');
    });

  });

  ['generate', 'g'].forEach(function(command) {
    it('ember ' + command + ' foo bar baz', function(){
      var generate = stubCommand('generate');
      var called;

      ember([command, 'foo', 'bar', 'baz']);

      called = generate.calledWith[0];

      assert.equal(generate.called, 1, 'expected the generate command to be run');
      assert.equal(called[0], 'foo');
      assert.equal(called[1], 'bar');
      assert.equal(called[2], 'baz');
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

      assert.equal(init.called, 1, 'expected the init command to be run');
      assert.equal(init.calledWith[0][0], 'my-blog', 'expect first arg to be the app name');
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

    assert.equal(build.called, 1, 'expected the build command to be run');
    assert.equal(build.calledWith[0][0], 'production', 'expect first arg to be the production environment');
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

    assert.equal(help.called, 0, 'expected the help command NOT to be run');
    assert.equal(foo.called, 1,  'expected the foo command to be run');
    assert.equal(foo.calledWith[0][0], 'lorem', 'expect foo to receive the string lorem');
    assert.equal(foo.calledWith[0][1], 'ipsum', 'expect foo to receive the string ipsum');
    assert.equal(foo.calledWith[0][2], 'dolor', 'expect foo to receive the string dolor');
    assert.ok(typeof foo.calledWith[0][3] === 'object', 'expect arg 4 to be the object options');
    assert.equal(foo.calledWith[0].length, 4, 'expect foo to receive a total of 4 args');
    assert.equal(foo.calledWith[0][3].flag1, 'one', 'expect foo to receive the flag1 with the string one');
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
});
