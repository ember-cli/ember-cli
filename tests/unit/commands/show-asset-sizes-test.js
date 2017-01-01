'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');
var path           = require('path');
var td = require('testdouble');

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
          this._super.init && this._super.init.apply(this, arguments);
          taskInstance = this;
        },
      }),
    };

    options = commandOptions({
      tasks: tasks,
      settings: {},
    });

    td.replace(tasks.ShowAssetSizes.prototype, 'run', td.function());
  });

  after(function () {
    ShowCommand = null;
    taskInstance = null;
  });

  afterEach(function () {
    td.reset();
  });

  it('has correct default value for output path', function() {
    return new ShowCommand(options).validateAndRun().then(function() {
      var captor = td.matchers.captor();
      td.verify(tasks.ShowAssetSizes.prototype.run(captor.capture()), {times: 1});
      expect(captor.value.outputPath).to.equal('dist/', 'has correct output path option when not set');
    });
  });

  it('has correct options', function() {
    return new ShowCommand(options)
      .validateAndRun(['--output-path', path.join('some', 'path')])
      .then(function() {
        var captor = td.matchers.captor();
        td.verify(tasks.ShowAssetSizes.prototype.run(captor.capture()), {times: 1});
        expect(captor.value.outputPath).to.equal(path.join(process.cwd(), 'some', 'path'), 'has correct asset path');
      });
  });
});

describe.skip('default options config file', function() {
  it('reads default options from .ember-cli file', function() {});
});
