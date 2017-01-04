'use strict';

let fs = require('fs-extra');
let path = require('path');
let chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;
let walkSync = require('walk-sync');
let assign = require('ember-cli-lodash-subset').assign;
let BuildTask = require('../../../lib/tasks/build');
let Promise = require('../../../lib/ext/promise');
let MockProject = require('../../helpers/mock-project');
let MockAnalytics = require('../../helpers/mock-analytics');
let copyFixtureFiles = require('../../helpers/copy-fixture-files');
let mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
let remove = Promise.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');

describe('build task test', function() {
  let project, ui;

  beforeEach(function() {
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

    return task.run(runOptions)
      .then(function() {
        let expected = ['foo.txt'];

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
});
