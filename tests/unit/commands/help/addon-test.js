/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');
var AddonCommand      = require('../../../../lib/commands/addon');

describe('help command: addon', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Addon': AddonCommand
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
    return command.validateAndRun(['addon']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember addon \u001b[33m<addon-name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
  Generates a new folder structure for building an addon, complete with test harness.' + EOL + '\
  \u001b[36m--dry-run\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -d\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -v\u001b[39m' + EOL + '\
  \u001b[36m--blueprint\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: addon)\u001b[39m' + EOL + '\
    \u001b[90maliases: -b <value>\u001b[39m' + EOL + '\
  \u001b[36m--skip-npm\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -sn\u001b[39m' + EOL + '\
  \u001b[36m--skip-bower\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -sb\u001b[39m' + EOL + '\
  \u001b[36m--skip-git\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -sg\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });
});
