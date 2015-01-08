'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var VersionCommand = require('../../../lib/commands/version');
var MockUI         = require('../../helpers/mock-ui');
var EOL            = require('os').EOL;

describe('version command', function() {
  var ui, command, options;

  beforeEach(function() {
    ui = new MockUI();
    options = commandOptions({
      settings: {},

      ui: ui,

      project: {
        isEmberCLIProject: function() {
          return false;
        }
      }
    });

    command = new VersionCommand(options);
  });

  it('should contain `disableAnalytics` option', function() {
    assert.equal(command.availableOptions.length, 2);
    assert.deepEqual(command.availableOptions[1], {
      key: 'disableAnalytics',
      type: Boolean,
      name: 'disable-analytics',
      required: false,
      default: false
    });
  });

  it('reports node and npm versions', function() {
    return command.validateAndRun().then(function() {
      var lines = ui.output.split(EOL);
      expect(someLineStartsWith(lines, 'node:'), 'contains the version of node');
      expect(someLineStartsWith(lines, 'npm:'), 'contains the version of npm');
    });
  });

  it('supports a --verbose flag', function() {
    return command.validateAndRun(['--verbose']).then(function() {
      var lines = ui.output.split(EOL);
      expect(someLineStartsWith(lines, 'node:'), 'contains the version of node');
      expect(someLineStartsWith(lines, 'npm:'), 'contains the version of npm');
      expect(someLineStartsWith(lines, 'v8:'), 'contains the version of v8');
    });
  });

});

function someLineStartsWith(lines, search) {
  return lines.some(function(line) {
    return line.indexOf(search) === 0;
  });
}
