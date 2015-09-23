/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');
var TestCommand       = require('../../../../lib/commands/test');

describe('help command: test', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Test': TestCommand
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
    return command.validateAndRun(['test']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember test \u001b[36m<options...>\u001b[39m' + EOL + '\
  Runs your app\'s test suite.' + EOL + '\
  \u001b[90maliases: t\u001b[39m' + EOL + '\
  \u001b[36m--environment\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: test)\u001b[39m' + EOL + '\
    \u001b[90maliases: -e <value>\u001b[39m' + EOL + '\
  \u001b[36m--config-file\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: ./testem.json)\u001b[39m' + EOL + '\
    \u001b[90maliases: -c <value>, -cf <value>\u001b[39m' + EOL + '\
  \u001b[36m--server\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -s\u001b[39m' + EOL + '\
  \u001b[36m--host\u001b[39m \u001b[36m(String)\u001b[39m' + EOL + '\
    \u001b[90maliases: -H <value>\u001b[39m' + EOL + '\
  \u001b[36m--test-port\u001b[39m \u001b[36m(Number)\u001b[39m \u001b[36m(Default: 7357)\u001b[39m The test port to use when running with --server.' + EOL + '\
    \u001b[90maliases: -tp <value>\u001b[39m' + EOL + '\
  \u001b[36m--filter\u001b[39m \u001b[36m(String)\u001b[39m A string to filter tests to run' + EOL + '\
    \u001b[90maliases: -f <value>\u001b[39m' + EOL + '\
  \u001b[36m--module\u001b[39m \u001b[36m(String)\u001b[39m The name of a test module to run' + EOL + '\
    \u001b[90maliases: -m <value>\u001b[39m' + EOL + '\
  \u001b[36m--watcher\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: events)\u001b[39m' + EOL + '\
    \u001b[90maliases: -w <value>\u001b[39m' + EOL + '\
  \u001b[36m--launch\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: false)\u001b[39m A comma separated list of browsers to launch for tests.' + EOL + '\
  \u001b[36m--reporter\u001b[39m \u001b[36m(String)\u001b[39m Test reporter to use [tap|dot|xunit]' + EOL + '\
    \u001b[90maliases: -r <value>\u001b[39m' + EOL + '\
  \u001b[36m--test-page\u001b[39m \u001b[36m(String)\u001b[39m Test page to invoke' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias t', function() {
    return command.validateAndRun(['t']).then(function() {
      var output = ui.output;

      var testString = processHelpString('ember test \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
