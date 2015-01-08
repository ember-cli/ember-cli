'use strict';
var expect           = require('chai').expect;
var CheckNPMOutdated = require('../../../../lib/tasks/doctor/check-npm-outdated');
var MockUI           = require('../../../helpers/mock-ui');
var chalk            = require('chalk');

describe('check npm outdated', function() {
  var loadCalledWith;
  var outdatedCalledWith;
  var uiWrote;
  var uiWroteLine;
  var ui;
  var npmOutdated;
  var npm;

  beforeEach(function() {
    outdatedCalledWith = loadCalledWith = uiWrote = undefined;
    ui = new MockUI();

    ui.writeLine = function(message) {
      uiWroteLine = message;
    };

    ui.write = function(message) {
      uiWrote = message;
    };

    npm = {
      load: function(options, callback) {
        setTimeout(function() {
          callback(undefined, npm);
        }, 0);
        loadCalledWith = options;
      },
      commands: {
        outdated: function(packages, callback) {
          setTimeout(callback, 0);
          outdatedCalledWith = packages;
        }
      }
    };

    npmOutdated = new CheckNPMOutdated({
      ui: ui,
      npm: npm
    });
  });

  it('should call npm with no explicit packages and a depth of 0', function() {
    return npmOutdated.run().then(function() {
      expect(outdatedCalledWith).to.deep.equal([]);
      expect(loadCalledWith.depth).to.equal(0);
    });
  });

  it('should prompt the developer with old packages', function() {
    npmOutdated.npm.commands.outdated = function(packages, callback) {
      setTimeout(function() {
        var outdated = ['/Users/chietala/workspace/ember-cli', 'testem', '0.6.22', '0.6.26', '0.6.28', '0.6.26'];
        callback(null, [outdated]);
      }, 0);
      outdatedCalledWith = packages;
    };

    return npmOutdated.run({packages: 'testem'}).then(function() {
      expect(outdatedCalledWith).to.deep.equal(['testem']);
      expect(uiWroteLine).to.equal(chalk.yellow('Your project has outdated packages.'));
    });
  });
});
