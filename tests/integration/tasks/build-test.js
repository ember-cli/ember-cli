'use strict';

const fs = require('fs-extra');
const path = require('path');
const { expect } = require('chai');
const { file } = require('chai-files');
const walkSync = require('walk-sync');
const BuildTask = require('../../../lib/tasks/build');
const MockProject = require('../../helpers/mock-project');
const MockProcess = require('../../helpers/mock-process');
const copyFixtureFiles = require('../../helpers/copy-fixture-files');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
let root = process.cwd();
let tmproot = path.join(root, 'tmp');

describe('build task test', function () {
  let project, ui, _process;

  beforeEach(function () {
    _process = new MockProcess();
    willInterruptProcess.capture(_process);
    return mkTmpDirIn(tmproot)
      .then(function (tmpdir) {
        process.chdir(tmpdir);
      })
      .then(function () {
        return copyFixtureFiles('tasks/builder');
      })
      .then(function () {
        project = new MockProject();
        ui = project.ui;
      });
  });

  afterEach(function () {
    willInterruptProcess.release();
    process.chdir(root);
    delete process.env.BROCCOLI_VIZ;

    return fs.remove(tmproot);
  });

  it('can build', function () {
    let outputPath = 'dist';
    let task = new BuildTask({
      project,
      ui,
    });

    let runOptions = {
      outputPath,
      environment: 'development',
    };

    return task.run(runOptions).then(() => {
      expect(walkSync(outputPath)).to.eql(['foo.txt']);
      expect(file('dist/foo.txt')).to.equal('Some file named foo.txt\n');
    });
  });

  it('it displays environment', function () {
    let outputPath = 'dist';
    let task = new BuildTask({
      project,
      ui,
    });

    let runOptions = {
      outputPath,
      environment: 'development',
    };

    return task.run(runOptions).then(() => {
      expect(ui.output).to.include('Environment: development');
    });
  });
});
