/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var stub              = require('../../../helpers/stub').stub;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');

describe('help command: blank', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {},
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    command = new HelpCommand(options);
  });

  it('works', function() {
    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {},
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun([]).then(function() {
      var output = ui.output;

      var testString = processHelpString('\
Usage: ember \u001b[33m<command (Default: help)>\u001b[39m' + EOL + '\
' + EOL + '\
Available commands in ember-cli:' + EOL + '\
' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('lists commands', function() {
    var Command1 = function() {};
    var Command2 = function() {};
    stub(Command1.prototype, 'printBasicHelp');
    stub(Command2.prototype, 'printBasicHelp');
    stub(Command1.prototype, 'printDetailedHelp');
    stub(Command2.prototype, 'printDetailedHelp');

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        Command1: Command1,        
        Command2: Command2
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun([]).then(function() {
      expect(Command1.prototype.printBasicHelp.called).to.equal(1);
      expect(Command2.prototype.printBasicHelp.called).to.equal(1);
      expect(Command1.prototype.printDetailedHelp.called).to.equal(0);
      expect(Command2.prototype.printDetailedHelp.called).to.equal(0);
    });
  });

  it('works with single command', function() {
    var Command1 = function() {};
    var Command2 = function() {};
    stub(Command1.prototype, 'printBasicHelp');
    stub(Command2.prototype, 'printBasicHelp');
    stub(Command1.prototype, 'printDetailedHelp');
    stub(Command2.prototype, 'printDetailedHelp');

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        Command1: Command1,
        Command2: Command2
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun(['command-1']).then(function() {
      expect(Command1.prototype.printBasicHelp.called).to.equal(1);
      expect(Command2.prototype.printBasicHelp.called).to.equal(0);
      expect(Command1.prototype.printDetailedHelp.called).to.equal(1);
      expect(Command2.prototype.printDetailedHelp.called).to.equal(0);
    });
  });

  it('handles missing command', function() {
    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'MyCommand': function() {}
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun(['missing-command']).then(function() {
      var output = ui.output;

      var testString = processHelpString('\
Requested ember-cli commands:' + EOL + '\
' + EOL + '\
\u001b[31mNo help entry for \'missing-command\'\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('lists addons', function() {
    var Command1 = function() {};
    var Command2 = function() {};
    stub(Command1.prototype, 'printBasicHelp');
    stub(Command2.prototype, 'printBasicHelp');

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {},
      project: {
        isEmberCLIProject: function() {
          return true;
        },
        eachAddonCommand: function(callback) {
          callback('my-addon', {
            Command1: Command1,
            Command2: Command2
          });
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun([]).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
Available commands from my-addon:' + EOL);

      expect(output).to.include(testString);

      expect(Command1.prototype.printBasicHelp.called).to.equal(1);
      expect(Command2.prototype.printBasicHelp.called).to.equal(1);
    });
  });
});
