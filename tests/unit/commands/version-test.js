'use strict';

var expect         = require('chai').expect;
var EOL            = require('os').EOL;
var commandOptions = require('../../factories/command-options');
var VersionCommand = require('../../../lib/commands/version');

describe('version command', function() {
  var options, command;

  beforeEach(function() {
    options = commandOptions({
      project: {
        isEmberCLIProject: function() {
          return false;
        }
      }
    });

    command = new VersionCommand(options);
  });

  it('reports node, npm, and os versions', function() {
    return command.validateAndRun().then(function() {
      var lines = options.ui.output.split(EOL);
      expect(someLineStartsWith(lines, 'ember-cli:'), 'contains the version of ember-cli').to.be.ok;
      expect(someLineStartsWith(lines, 'node:'), 'contains the version of node').to.be.ok;
      expect(someLineStartsWith(lines, 'os:'), 'contains the version of os').to.be.ok;
    });
  });

  it('supports a --verbose flag', function() {
    return command.validateAndRun(['--verbose']).then(function() {
      var lines = options.ui.output.split(EOL);
      expect(someLineStartsWith(lines, 'node:'), 'contains the version of node').to.be.ok;
      expect(someLineStartsWith(lines, 'os:'), 'contains the version of os').to.be.ok;
      expect(someLineStartsWith(lines, 'v8:'), 'contains the version of v8').to.be.ok;
    });
  });
});

function someLineStartsWith(lines, search) {
  return lines.some(function(line) {
    return line.indexOf(search) === 0;
  });
}
