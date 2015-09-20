'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');
var AddonCommand  = require('../../../../lib/commands/addon');

describe('help command: addon json', function() {
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
    return command.validateAndRun(['addon', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'addon',
        description: 'Generates a new folder structure for building an addon, complete with test harness.',
        aliases: [],
        works: 'outsideProject',
        availableOptions: [
          {
            name: 'dry-run',
            default: false,
            aliases: ['d'],
            key: 'dryRun',
            required: false
          },
          {
            name: 'verbose',
            default: false,
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'blueprint',
            default: 'addon',
            aliases: ['b'],
            key: 'blueprint',
            required: false
          },
          {
            name: 'skip-npm',
            default: false,
            aliases: ['sn'],
            key: 'skipNpm',
            required: false
          },
          {
            name: 'skip-bower',
            default: false,
            aliases: ['sb'],
            key: 'skipBower',
            required: false
          },
          {
            name: 'skip-git',
            default: false,
            aliases: ['sg'],
            key: 'skipGit',
            required: false
          }
        ],
        anonymousOptions: ['<addon-name>']
      });
    });
  });
});
