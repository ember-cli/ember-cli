'use strict';

var fs = require('fs-extra');
var path = require('path');
var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;
var walkSync = require('walk-sync');
var assign = require('ember-cli-lodash-subset').assign;
var BuildTask = require('../../../lib/tasks/build');
var Promise = require('../../../lib/ext/promise');
var MockProject = require('../../helpers/mock-project');
var MockAnalytics = require('../../helpers/mock-analytics');
var copyFixtureFiles = require('../../helpers/copy-fixture-files');
var mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
var remove = Promise.denodeify(fs.remove);
var root = process.cwd();
var tmproot = path.join(root, 'tmp');

describe('build task test', function() {
  var project, ui;

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
    var outputPath = 'dist';
    var task = new BuildTask({
      analytics: new MockAnalytics(),
      project: project,
      ui: ui
    });

    var runOptions = {
      outputPath: outputPath,
      environment: 'development'
    };

    return task.run(runOptions)
      .then(function() {
        var expected = [ 'foo.txt'];

        expect(walkSync(outputPath)).to.eql(['foo.txt']);
        expect(file('dist/foo.txt')).to.equal('Some file named foo.txt\n');
      });
  });

  it('generates valid visualization output', function() {
    process.env.BROCCOLI_VIZ = '1';

    var outputPath = 'dist';
    var task = new BuildTask({
      analytics: new MockAnalytics(),
      project: project,
      ui: ui
    });

    var runOptions = {
      outputPath: outputPath,
      environment: 'development'
    };

    return task.run(runOptions)
      .then(function() {
        var vizOutputPath = 'broccoli-viz.build.0.json';
        expect(file(vizOutputPath)).to.exist;

        // confirm it is valid json
        var output = fs.readJsonSync(vizOutputPath);
        expect(Object.keys(output)).to.eql([
          'summary', 'nodes'
        ]);

        expect(output.summary.build.type).to.equal('initial');
        expect(output.summary.buildSteps).to.equal(1);

        expect(Array.isArray(output.nodes)).to.equal(true);
      });
  });
});
