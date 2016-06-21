'use strict';

var expect         = require('chai').expect;
var stub           = require('../../helpers/stub');
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');
var path           = require('path');

var safeRestore = stub.safeRestore;
stub = stub.stub;

describe('asset-sizes command', function () {
  var ShowCommand;
  var tasks;
  var options;
  var taskInstance;

  before(function () {
    ShowCommand = require('../../../lib/commands/asset-sizes');
  });

  beforeEach(function () {
    tasks = {
      ShowAssetSizes: Task.extend({
        init: function () {
          taskInstance = this;
        }
      })
    };

    options = commandOptions({
      tasks: tasks,
      settings: {}
    });

    stub(tasks.ShowAssetSizes.prototype, 'run');
  });

  after(function () {
    ShowCommand = null;
    taskInstance = null;
  });

  afterEach(function () {
    safeRestore(tasks.ShowAssetSizes.prototype, 'run');
  });

  it('has correct default value for output path', function() {
    return new ShowCommand(options).validateAndRun().then(function() {
      var run = tasks.ShowAssetSizes.prototype.run;
      var ops = run.calledWith[0][0];

      expect(run.called).to.equal(1, 'expected run to be called once');
      expect(ops.outputPath).to.equal('dist/', 'has correct output path option when not set');
    });
  });

  it('has correct options', function() {
    return new ShowCommand(options)
      .validateAndRun(['--output-path', path.join('some', 'path')])
      .then(function() {
        var run = tasks.ShowAssetSizes.prototype.run;
        var ops = run.calledWith[0][0];

        expect(run.called).to.equal(1, 'expected run to be called once');
        expect(ops.outputPath).to.equal(path.join(process.cwd(), 'some', 'path'), 'has correct asset path');
      });
  });
});

describe.skip('default options config file', function() {
  it('reads default options from .ember-cli file', function() {});
});
