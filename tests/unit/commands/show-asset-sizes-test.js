'use strict';

const expect = require('chai').expect;
const commandOptions = require('../../factories/command-options');
const Task = require('../../../lib/models/task');
const path = require('path');
const td = require('testdouble');

describe('asset-sizes command', function() {
  let ShowCommand;
  let tasks;
  let options;

  before(function() {
    ShowCommand = require('../../../lib/commands/asset-sizes');
  });

  beforeEach(function() {
    tasks = {
      ShowAssetSizes: Task.extend({}),
    };

    options = commandOptions({
      tasks,
      settings: {},
    });

    td.replace(tasks.ShowAssetSizes.prototype, 'run', td.function());
  });

  after(function() {
    ShowCommand = null;
  });

  afterEach(function() {
    td.reset();
  });

  it('has correct default value for output path', function() {
    return new ShowCommand(options).validateAndRun().then(function() {
      let captor = td.matchers.captor();
      td.verify(tasks.ShowAssetSizes.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.outputPath).to.equal('dist/', 'has correct output path option when not set');
    });
  });

  it('has correct options', function() {
    return new ShowCommand(options).validateAndRun(['--output-path', path.join('some', 'path')]).then(function() {
      let captor = td.matchers.captor();
      td.verify(tasks.ShowAssetSizes.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.outputPath).to.equal(path.join(process.cwd(), 'some', 'path'), 'has correct asset path');
    });
  });
});

describe.skip('default options config file', function() {
  it('reads default options from .ember-cli file', function() {});
});
