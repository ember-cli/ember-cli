'use strict';

var expect         = require('chai').expect;
var MockUI         = require('../../../helpers/mock-ui');
var MockAnalytics  = require('../../../helpers/mock-analytics');
var convertToJson  = require('../../../helpers/convert-help-output-to-json');
var HelpCommand    = require('../../../../lib/commands/help');
var VersionCommand = require('../../../../lib/commands/version');

describe('help command: version json', function() {
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
    return command.validateAndRun(['version', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'version',
        description: 'outputs ember-cli version',
        aliases: ['v', '--version', '-v'],
        works: 'everywhere',
        availableOptions: [
          {
            name: 'verbose',
            default: false,
            key: 'verbose',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias v', function() {
    return command.validateAndRun(['v', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('version');
    });
  });
});
