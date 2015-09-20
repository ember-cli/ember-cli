/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');

describe('help command: help', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Help': HelpCommand
      },
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
    return command.validateAndRun(['help']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember help \u001b[33m<command-name (Default: all)>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
  Outputs the usage instructions for all commands or the provided command' + EOL + '\
  \u001b[90maliases: h, --help, -h\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -v\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias h', function() {
    return command.validateAndRun(['h']).then(function() {
      var output = ui.output;

      var testString = processHelpString('ember help \u001b[33m<command-name (Default: all)>\u001b[39m \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
