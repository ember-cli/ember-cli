'use strict';

var assert         = require('../../helpers/assert');
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

  it('reports node and npm versions', function() {
    command.validateAndRun();
    var lines = ui.output.split(EOL);
    assert(someLineStartsWith(lines, 'node:'), 'contains the version of node');
    assert(someLineStartsWith(lines, 'npm:'), 'contains the version of npm');
  });

  it('supports a --verbose flag', function() {
    command.validateAndRun(['--verbose']);
    var lines = ui.output.split(EOL);
    assert(someLineStartsWith(lines, 'node:'), 'contains the version of node');
    assert(someLineStartsWith(lines, 'npm:'), 'contains the version of npm');
    assert(someLineStartsWith(lines, 'v8:'), 'contains the version of v8');
  });

});

function someLineStartsWith(lines, search) {
  return lines.some(function(line) {
    return line.indexOf(search) === 0;
  });
}
