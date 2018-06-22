'use strict';

const fs = require('fs-extra');
const path = require('path');
const chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;
const walkSync = require('walk-sync');
const BuildTask = require('../../../lib/tasks/build');
const RSVP = require('rsvp');
const MockProject = require('../../helpers/mock-project');
const MockAnalytics = require('../../helpers/mock-analytics');
const MockProcess = require('../../helpers/mock-process');
const copyFixtureFiles = require('../../helpers/copy-fixture-files');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
let remove = RSVP.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');

describe('build task test', function() {
  let project, ui, _process;

  beforeEach(function() {
    _process = new MockProcess();
    willInterruptProcess.capture(_process);
    return mkTmpDirIn(tmproot)
      .then(function(tmpdir) {
        process.chdir(tmpdir);
      })
      .then(function() {
        return copyFixtureFiles('tasks/builder');
      })
      .then(function() {
        project = new MockProject();
        ui = project.ui;
      });
  });

  afterEach(function() {
    willInterruptProcess.release();
    process.chdir(root);
    delete process.env.BROCCOLI_VIZ;

    return remove(tmproot);
  });

  it('can build', function() {
    let outputPath = 'dist';
    let task = new BuildTask({
      analytics: new MockAnalytics(),
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

  it('generates valid visualization output', function() {
    process.env.BROCCOLI_VIZ = '1';

    let outputPath = 'dist';
    let task = new BuildTask({
      analytics: new MockAnalytics(),
      project,
      ui,
    });

    let runOptions = {
      outputPath,
      environment: 'development',
    };

    return task.run(runOptions)
      .then(function() {
        let vizOutputPath = 'instrumentation.build.0.json';
        expect(file(vizOutputPath)).to.exist;

        // confirm it is valid json
        let output = fs.readJsonSync(vizOutputPath);
        expect(Object.keys(output)).to.eql([
          'summary', 'nodes',
        ]);

        expect(output.summary.build.type).to.equal('initial');
        expect(output.summary.buildSteps).to.equal(1);

        expect(Array.isArray(output.nodes)).to.equal(true);
      });
  });

  it('it displays environment', function() {
    let outputPath = 'dist';
    let task = new BuildTask({
      analytics: new MockAnalytics(),
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
