/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');
var InstallCommand    = require('../../../../lib/commands/install');

describe('help command: init', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Install': InstallCommand
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
    return command.validateAndRun(['install']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember install \u001b[33m<addon-name>\u001b[39m' + EOL + '\
  Installs an ember-cli addon from npm.' + EOL);

      expect(output).to.include(testString);
    });
  });
});
