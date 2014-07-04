'use strict';

var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var rewire        = require('rewire');
var Promise       = require('../../../lib/ext/promise');
var UpdateTask    = rewire('../../../lib/tasks/update');

describe('update task', function() {
  var updateTask;
  var ui;

  var loadCalledWith;
  var installCalledWith;
  var initCommandWasRun;

  var npm = {
    load: function(options, callback) {
      setTimeout(function() {
        callback(undefined, npm);
      }, 0);
      loadCalledWith = options;
    },
    commands: {
      install: function(packages, callback) {
        setTimeout(callback, 0);
        installCalledWith = packages;
      }
    }
  };

  beforeEach(function() {
    installCalledWith = loadCalledWith = initCommandWasRun = undefined;
  });

  describe('don\'t update', function() {
    beforeEach(function() {
      ui = new MockUI();

      ui.prompt = function(messageObject) {
        return new Promise(function(resolve) {
          ui.write(messageObject.message);
          resolve({
            answer: false
          });
        });
      };
      updateTask = new UpdateTask({
        ui: ui,
        npm: npm
      });
    });

    it('says \'a new version is available\' and asks you to confirm you want to update', function() {
      return updateTask.run({
        environment: 'development'
      }, {
        newestVersion: '100.0.0'
      }).then(function() {
        assert.include(ui.output, 'A new version of ember-cli is available');
        assert.include(ui.output, 'Are you sure you want to update ember-cli?');
      });
    });
  });

  describe('do update', function() {
    beforeEach(function() {
      ui = new MockUI();

      ui.pleasantProgress = {
        start: function() { },
        stop: function() { }
      };

      ui.prompt = function(messageObject) {
        return new Promise(function(resolve) {
          ui.write(messageObject.message);
          resolve({
            answer: true
          });
        });
      };

      function Init() {

      }

      Init.prototype.run = function() {
        initCommandWasRun = true;
      };

      updateTask = new UpdateTask({
        commands: {
          Init: Init
        },
        ui: ui,
        npm: npm,
        project: {
          root: 'tests/fixtures/dummy-project-outdated',
          pkg: require('../../fixtures/dummy-project-outdated/package.json')
        }
      });
    });

    it('says \'a new version is available\' and asks you to confirm you want to update', function() {
      this.timeout(1000000);
      return updateTask.run({
        environment: 'development'
      }, {
        newestVersion: '100.0.0'
      }).then(function() {
        assert.include(ui.output, 'A new version of ember-cli is available');
        assert.include(ui.output, 'Are you sure you want to update ember-cli?');
        assert.deepEqual(installCalledWith, [ 'ember-cli' ], '');
        assert.deepEqual(loadCalledWith, {
          'global': true,
          'loglevel': 'silent'
        }, '');
        assert(initCommandWasRun);
      });
    });

    it('updates package.json file with newly updated version number', function() {
      return updateTask.run({
        environment: 'development'
      }, {
        newestVersion: '100.0.0'
      }).then(function() {
        var pkg = updateTask.project.pkg;
        assert.equal(pkg.devDependencies['ember-cli'], '100.0.0');
      });
    });

  });
});
