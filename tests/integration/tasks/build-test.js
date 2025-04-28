'use strict';

const fs = require('fs-extra');
const { expect } = require('chai');
const { file } = require('chai-files');
const walkSync = require('walk-sync');
const BuildTask = require('../../../lib/tasks/build');
const MockProject = require('../../helpers/mock-project');
const MockProcess = require('../../helpers/mock-process');
const copyFixtureFiles = require('../../helpers/copy-fixture-files');
const willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
let root = process.cwd();
const tmp = require('tmp-promise');

describe('build task test', function () {
  let project, ui, _process;

  beforeEach(async function () {
    _process = new MockProcess();
    willInterruptProcess.capture(_process);

    const { path } = await tmp.dir();
    process.chdir(path);

    await copyFixtureFiles('tasks/builder');

    project = new MockProject();
    ui = project.ui;
  });

  afterEach(function () {
    willInterruptProcess.release();
    process.chdir(root);
    delete process.env.BROCCOLI_VIZ;
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

  it('generates valid visualization output', function () {
    process.env.BROCCOLI_VIZ = '1';

    let outputPath = 'dist';
    let task = new BuildTask({
      project,
      ui,
    });

    let runOptions = {
      outputPath,
      environment: 'development',
    };

    return task.run(runOptions).then(function () {
      let vizOutputPath = 'instrumentation.build.0.json';
      expect(file(vizOutputPath)).to.exist;

      // confirm it is valid json
      let output = fs.readJsonSync(vizOutputPath);
      expect(Object.keys(output)).to.eql(['summary', 'nodes']);

      expect(output.summary.build.type).to.equal('initial');
      expect(output.summary.buildSteps).to.equal(1);

      expect(Array.isArray(output.nodes)).to.equal(true);
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
