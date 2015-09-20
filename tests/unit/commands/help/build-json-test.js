'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');
var BuildCommand  = require('../../../../lib/commands/build');

describe('help command: build json', function() {
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
    return command.validateAndRun(['build', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'build',
        description: 'Builds your app and places it into the output path (dist/ by default).',
        aliases: ['b'],
        works: 'insideProject',
        availableOptions: [
          {
            name: 'environment',
            default: 'development',
            aliases: [
              'e',
              { dev: 'development' },
              { prod: 'production' }
            ],
            key: 'environment',
            required: false
          },
          {
            name: 'output-path',
            type: 'path',
            default: 'dist/',
            aliases: ['o'],
            key: 'outputPath',
            required: false
          },
          {
            name: 'watch',
            default: false,
            aliases: ['w'],
            key: 'watch',
            required: false
          },
          {
            name: 'watcher',
            key: 'watcher',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias b', function() {
    return command.validateAndRun(['b', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('build');
    });
  });
});
