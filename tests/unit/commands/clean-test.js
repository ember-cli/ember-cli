'use strict';

var expect          = require('chai').expect;
var stub            = require('../../helpers/stub').stub;
var MockProject     = require('../../helpers/mock-project');
var commandOptions  = require('../../factories/command-options');
var Task            = require('../../../lib/models/task');
var Promise         = require('../../../lib/ext/promise');
var CleanCommand    = require('../../../lib/commands/clean');
var path            = require('path');

describe('install command', function() {
  var npmInstance, bowerInstance, removeFilesInstance;
  var command, tasks;

  beforeEach(function() {
    var project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    tasks = {
      NpmCacheClean: Task.extend({
        project: project,
        init: function() {
          npmInstance = this;
        }
      }),

      BowerCacheClean: Task.extend({
        project: project,
        init: function() {
          bowerInstance = this;
        }
      }),

      RemoveFiles: Task.extend({
        init: function() {
          removeFilesInstance = this;
        }
      })
    };

    var options = commandOptions({
      project: project,
      tasks: tasks
    });

    stub(tasks.NpmCacheClean.prototype, 'run', Promise.resolve());
    stub(tasks.BowerCacheClean.prototype, 'run', Promise.resolve());
    stub(tasks.RemoveFiles.prototype, 'run', Promise.resolve());

    command = new CleanCommand(options);
  });

  afterEach(function() {
    tasks.NpmCacheClean.prototype.run.restore();
    tasks.BowerCacheClean.prototype.run.restore();
    tasks.RemoveFiles.prototype.run.restore();
  });

  it('an error ocurred', function() {
    stub(tasks.NpmCacheClean.prototype, 'run', Promise.reject(Error('Permission denied')));

    return command.validateAndRun([
      '--skip-npm', 'false',
      '--skip-bower', 'false'
    ]).then(function() {
      expect(command.ui.output).to.includes('Error: Permission denied', 'Error message is in output');
    });
  });

  it('initializes npm cache clean, bower cache clean and remove files tasks with ui, project and analytics', function() {
    return command.validateAndRun([
      '--skip-npm', 'false',
      '--skip-bower', 'false'
    ]).then(function() {
      expect(npmInstance.ui, 'ui was set');
      expect(npmInstance.project, 'project was set');
      expect(npmInstance.analytics, 'analytics was set');

      expect(bowerInstance.ui, 'ui was set');
      expect(bowerInstance.project, 'project was set');
      expect(bowerInstance.analytics, 'analytics was set');

      expect(removeFilesInstance.ui, 'ui was set');
      expect(removeFilesInstance.project, 'project was set');
      expect(removeFilesInstance.analytics, 'analytics was set');
    });
  });

  describe('with args', function() {
    it('all included', function() {
      return command.validateAndRun([
        '--skip-npm', 'false',
        '--skip-bower', 'false'
      ]).then(function() {
        var npmRun = tasks.NpmCacheClean.prototype.run;
        var bowerRun = tasks.BowerCacheClean.prototype.run;
        var removeFilesRun = tasks.RemoveFiles.prototype.run;
        expect(npmRun.called).to.equal(1, 'expected `npm cache clean` run was called once');
        expect(bowerRun.called).to.equal(1, 'expected `bower cache clean` run was called once');
        expect(removeFilesRun.called).to.equal(1, 'expected npm install run was called once');

        expect(removeFilesRun.calledWith[0][0]).to.deep.equal({
          dryRun: false,
          verbose: false,
          paths: ['tmp', 'dist/', 'bower_components', 'node_modules'],
        }, 'expected called with tmp, output-dir, node_modules and bower_components');
      });
    });

    it('no npm', function() {
      return command.validateAndRun([
        '--skip-npm', 'true',
        '--skip-bower', 'false'
      ]).then(function() {
        var npmRun = tasks.NpmCacheClean.prototype.run;
        var bowerRun = tasks.BowerCacheClean.prototype.run;
        var removeFilesRun = tasks.RemoveFiles.prototype.run;
        expect(npmRun.called).to.equal(0, 'expected `npm cache clean` run was not called');
        expect(bowerRun.called).to.equal(1, 'expected `bower cache clean` run was called once');
        expect(removeFilesRun.called).to.equal(1, 'expected npm install run was called once');

        expect(removeFilesRun.calledWith[0][0]).to.deep.equal({
          dryRun: false,
          verbose: false,
          paths: ['tmp', 'dist/', 'bower_components'],
        }, 'expected called with tmp, output-dir and bower_components');
      });
    });

    it('no bower', function() {
      return command.validateAndRun([
        '--skip-npm', 'false',
        '--skip-bower', 'true'
      ]).then(function() {
        var npmRun = tasks.NpmCacheClean.prototype.run;
        var bowerRun = tasks.BowerCacheClean.prototype.run;
        var removeFilesRun = tasks.RemoveFiles.prototype.run;
        expect(npmRun.called).to.equal(1, 'expected `npm cache clean` run was called once');
        expect(bowerRun.called).to.equal(0, 'expected `bower cache clean` run was not called');
        expect(removeFilesRun.called).to.equal(1, 'expected npm install run was called once');

        expect(removeFilesRun.calledWith[0][0]).to.deep.equal({
          dryRun: false,
          verbose: false,
          paths: ['tmp', 'dist/', 'node_modules'],
        }, 'expected called with tmp, output-dir and node_modules');
      });
    });

    it('skip package managers', function() {
      return command.validateAndRun([
        '--skip-npm', 'true',
        '--skip-bower', 'true'
      ]).then(function() {
        var npmRun = tasks.NpmCacheClean.prototype.run;
        var bowerRun = tasks.BowerCacheClean.prototype.run;
        var removeFilesRun = tasks.RemoveFiles.prototype.run;
        expect(npmRun.called).to.equal(0, 'expected `npm cache clean` run was not called');
        expect(bowerRun.called).to.equal(0, 'expected `bower cache clean` run was not called');
        expect(removeFilesRun.called).to.equal(1, 'expected npm install run was called once');

        expect(removeFilesRun.calledWith[0][0]).to.deep.equal({
          dryRun: false,
          verbose: false,
          paths: ['tmp', 'dist/'],
        }, 'expected called with tmp and output-dir');
      });
    });

    it('custom output path', function() {
      return command.validateAndRun([
        '--skip-npm', 'true',
        '--skip-bower', 'true',
        '--output-path', 'OutputDir/'
      ]).then(function() {
        var removeFilesRun = tasks.RemoveFiles.prototype.run;

        expect(removeFilesRun.calledWith[0][0]).to.deep.equal({
          dryRun: false,
          verbose: false,
          paths: [
            'tmp',
            // output-dir has a `path` type so it's automatically normalizes to absolute path
            path.join(process.cwd(), 'OutputDir')
          ],
        }, 'expected called with tmp/ and OutputDir/');
      });
    });
  });
});

