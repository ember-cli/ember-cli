'use strict';

var expect          = require('chai').expect;
var MockUI          = require('../../helpers/mock-ui');
var RemoveFilesTask = require('../../../lib/tasks/remove-files');

describe('remove files task', function() {
  var ui;
  var rimrafCalledWith = [];

  var rimrafSync = function(path) {
    rimrafCalledWith.push(path);
  };

  beforeEach(function() {
    rimrafCalledWith = [];
  });

  it('exception if no path', function() {
    ui = new MockUI();
    var task = new RemoveFilesTask({
        ui: ui
    });

    try {
      task.run({paths: []});
    } catch (e) {
      expect(e.message).to.be.equal('No file paths specified to remove');
    }
  });

  it('single path', function() {
    ui = new MockUI();
    var task = new RemoveFilesTask({
        ui: ui,
        rimrafSync: rimrafSync
    });

    return task.run({paths: 'folder'}).then(function() {
      expect(rimrafCalledWith).to.deep.equal(['folder']);
      expect(ui.output).to.include('Directory \'folder/\' removed');
    });
  });

  it('several paths', function() {
    ui = new MockUI();
    var task = new RemoveFilesTask({
        ui: ui,
        rimrafSync: rimrafSync
    });

    return task.run({paths: ['folder1', 'folder2/']}).then(function() {
      expect(rimrafCalledWith).to.deep.equal(['folder1', 'folder2/']);
      expect(ui.output).to.include('Directory \'folder1/\' removed');
      expect(ui.output).to.include('Directory \'folder2/\' removed');
    });
  });
 });
