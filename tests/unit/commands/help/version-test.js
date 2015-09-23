/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');
var VersionCommand    = require('../../../../lib/commands/version');

describe('help command: version', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Version': VersionCommand
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
    return command.validateAndRun(['version']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember version \u001b[36m<options...>\u001b[39m' + EOL + '\
  outputs ember-cli version' + EOL + '\
  \u001b[90maliases: v, --version, -v\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias v', function() {
    return command.validateAndRun(['v']).then(function() {
      var output = ui.output;

      var testString = processHelpString('ember version \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
