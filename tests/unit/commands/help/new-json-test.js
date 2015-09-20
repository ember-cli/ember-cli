'use strict';

var expect            = require('chai').expect;
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var convertToJson     = require('../../../helpers/convert-help-output-to-json');
var HelpCommand       = require('../../../../lib/commands/help');
var NewCommand        = require('../../../../lib/commands/new');

describe('help command: new json', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'New': NewCommand
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
    return command.validateAndRun(['new', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'new',
        description: processHelpString('Creates a new directory and runs \u001b[32member init\u001b[39m in it.'),
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
            default: 'app',
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
          },
          {
            name: 'directory',
            aliases: ['dir'],
            key: 'directory',
            required: false
          }
        ],
        anonymousOptions: ['<app-name>']
      });
    });
  });
});
