'use strict';

var expect         = require('chai').expect;
var MockUI         = require('../../../helpers/mock-ui');
var MockAnalytics  = require('../../../helpers/mock-analytics');
var convertToJson  = require('../../../helpers/convert-help-output-to-json');
var HelpCommand    = require('../../../../lib/commands/help');
var InstallCommand = require('../../../../lib/commands/install');

describe('help command: install json', function() {
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
    return command.validateAndRun(['install', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'install',
        description: 'Installs an ember-cli addon from npm.',
        aliases: [],
        works: 'insideProject',
        availableOptions: [],
        anonymousOptions: ['<addon-name>']
      });
    });
  });
});
