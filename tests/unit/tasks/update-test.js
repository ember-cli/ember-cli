'use strict';

var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var rewire        = require('rewire');
var Promise       = require('../../../lib/ext/promise');
var UpdateTask    = rewire('../../../lib/tasks/update');

describe('update task', function() {
  var updateTask;
  var ui;

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
    });
  });

  it('says "a new version is available" and asks you to confirm you want to update', function() {
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
