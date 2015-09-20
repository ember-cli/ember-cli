'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');

describe('help command: blank json', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  it('works', function() {
    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {},
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun(['--json']).then(function() {
      var json = convertToJson(ui.output);

      expect(json).to.deep.equal({
        name: 'ember',
        description: null,
        aliases: [],
        works: 'insideProject',
        availableOptions: [],
        anonymousOptions: ['<command (Default: help)>'],
        commands: [],
        addons: []
      });
    });
  });

  it('lists commands', function() {
    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        Command1: function() {
          return {
            getJson: function() {
              return {
                test1: 'bar'
              };
            }
          };
        },        
        Command2: function() {
          return {
            getJson: function() {
              return {
                test2: 'bar'
              };
            }
          };
        }
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun(['--json']).then(function() {
      var json = convertToJson(ui.output);

      expect(json.commands).to.deep.equal([
        {
          test1: 'bar'
        },
        {
          test2: 'bar'
        }
      ]);
    });
  });

  it('handles missing command', function() {
    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'MyCommand': function() {}
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    var command = new HelpCommand(options);

    return command.validateAndRun(['missing-command', '--json']).then(function() {
      var json = convertToJson(ui.output);

      expect(json.commands.length).to.equal(0);
    });
  });
});
