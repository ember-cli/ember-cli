var describe = require('mocha').describe;
var before = require('mocha').beforeEach;
var after = require('mocha').afterEach;
var it = require('mocha').it;
var assert = require('assert');
var stub = require('../helpers/stub');
var MockUI = require('../helpers/mock_ui');
var Cli = require('../../lib/cli');

var ui;
var commands;
var argv;
var baseArgs = ['node', 'path/to/cli'];

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

function command(name) {
  var mod;
  try {
    mod = require('../../lib/commands/' + name);
  } catch(e) { }
  commands[name] = mod || {};
  return stub(commands[name], 'run');
}

before(function() {
  ui = new MockUI();
  argv = [];
  commands = {};
});

after(function() {
  commands = argv = ui = undefined;
});

describe('CLI', function(){
  it('exists', function(){
    assert(Cli);
  });

  it("ember", function(){
    var help = command('help');

    ember();

    assert.equal(help.called, 1, 'expected help to be called once');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it("ember --version", function(){
    ember(['--version']);
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
  });

  it("ember -v", function(){
    ember(['-v']);
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
  });

  it("ember --help", function(){
    var help = command('help');

    ember(['--help']);

    assert.equal(help.called, 1, 'expected the help command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it("ember -h", function(){
    var help = command('help');

    ember(['-h']);

    assert.equal(help.called, 1, 'expected the help command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it("ember --help --version", function(){
    var help = command('help');

    ember(['--version', '--help']);

    // --version takes priority
    assert.equal(help.called, 0, 'expected the help command to be run');
    assert(/ember-cli \d+\.\d+\.\d+/.test(ui.output[0]), 'expected the output to contain the version string');
    assert.deepEqual(ui.output.length, 1, 'expected  one line of output');
  });

  it("ember server --port 9999", function(){
    var server = command('server');

    ember(['server', '--port',  '9999']);

    assert.equal(server.called, 1, 'expected the server command to be run');
    assert.equal(server.calledWith[0][0].port, 9999, 'correct port');
    assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
  });

  it("ember server -p 9999", function(){
    var server = command('server');

    ember(['server', '-p',  '9999']);

    assert.equal(server.called, 1, 'expected the server command to be run');
    assert.equal(server.calledWith[0][0].port, 9999, 'correct port');
    assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
  });

  it("ember server --host localhost", function(){
    var server = command('server');

    ember(['server', '--host', 'localhost']);

    assert.equal(server.called, 1, 'expected the server command to be run');
    assert.equal(server.calledWith[0][0].host, 'localhost', 'correct localhost');
    assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
  });

  it("ember server --port 9292 --host localhost", function(){
    var server = command('server');

    ember(['server', '--port', '9292',  '--host',  'localhost']);

    assert.equal(server.called, 1, 'expected the server command to be run');
    assert.equal(server.calledWith[0][0].host, 'localhost', 'correct localhost');
    assert.equal(server.calledWith[0][0].port, '9292', 'correct localhost');
    assert.deepEqual(ui.output.length, 0, 'expected  one line of output');
  });
  
  it("ember init", function(){
    var init = command('init');

    ember(['init']);

    assert.equal(init.called, 1, 'expected the init command to be run');
    assert.equal(ui.output.length, 0, 'expected no output');
  });
  
  it("ember init <app-name>", function(){
    var init = command('init');

    ember(['init', 'my-blog']);

    assert.equal(init.called, 1, 'expected the init command to be run');
    assert.equal(init.calledWith[0][0], 'my-blog', 'expect first arg to be the app name');
    assert.equal(ui.output.length, 0, 'expected no output');
  });

  it("ember <valid command>", function(){
    var help = command('help');
    var foo = command('foo');

    ember(['foo']);

    assert.equal(help.called, 0, 'expected the help command NOT to be run');
    assert.equal(foo.called, 1,  'expected the foo command to be run');
    assert.deepEqual(ui.output, [], 'expected no output');
  });

  it("ember <valid command with args>", function(){
    var help = command('help');
    var foo = command('foo');

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

  it("ember <invalid command>", function(){
    var help = command('help');
    var foo = command('foo');

    ember(['unknownCommand']);

    assert(/The specified command .*unknownCommand.* is invalid/.test(ui.output[0]), 'expected an invalid command message');
    assert.equal(foo.called, 0, 'exptected the foo command no to be run');
    assert.equal(help.called, 0, 'expected the help command to be run');
  });
});
