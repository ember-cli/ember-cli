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
  commands[name] = {};
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

  it("ember --help", function(){
    var help = command('help');

    ember(['--help']);

    assert.equal(help.called, 1, 'expected the help command to be run');
    assert.deepEqual(ui.output, [], 'expected no outout');
  });

  it("ember <valid command>", function(){
    var help = command('help');
    var foo = command('foo');

    ember(['foo']);

    assert.equal(help.called, 0, 'expected the help command NOT to be run');
    assert.equal(foo.called, 1,  'expected the foo command to be run');
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
