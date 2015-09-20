/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var HelpCommand       = require('../../../../lib/commands/help');
var BuildCommand      = require('../../../../lib/commands/build');

describe('help command: build', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Build': BuildCommand
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
    return command.validateAndRun(['build']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember build \u001b[36m<options...>\u001b[39m' + EOL + '\
  Builds your app and places it into the output path (dist/ by default).' + EOL + '\
  \u001b[90maliases: b\u001b[39m' + EOL + '\
  \u001b[36m--environment\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: development)\u001b[39m' + EOL + '\
    \u001b[90maliases: -e <value>, -dev (--environment=development), -prod (--environment=production)\u001b[39m' + EOL + '\
  \u001b[36m--output-path\u001b[39m \u001b[36m(Path)\u001b[39m \u001b[36m(Default: dist/)\u001b[39m' + EOL + '\
    \u001b[90maliases: -o <value>\u001b[39m' + EOL + '\
  \u001b[36m--watch\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -w\u001b[39m' + EOL + '\
  \u001b[36m--watcher\u001b[39m \u001b[36m(String)\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias b', function() {
    return command.validateAndRun(['b']).then(function() {
      var output = ui.output;

      var testString = processHelpString('ember build \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
