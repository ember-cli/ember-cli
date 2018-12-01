'use strict';

const co = require('co');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;
const ci = require('ci-info');

const MockProject = require('../../helpers/mock-project');
const Builder = require('../../../lib/models/builder');
const { isExperimentEnabled } = require('../../../lib/experiments');

const { createTempDir, fromBuilder } = broccoliTestHelper;
const ROOT = process.cwd();

describe('Builder - broccoli tests', function() {
  let projectRoot, builderOutputPath, output, project, builder;

  beforeEach(co.wrap(function *() {
    projectRoot = yield createTempDir();
    builderOutputPath = yield createTempDir();

    project = new MockProject({ root: projectRoot.path() });
  }));

  afterEach(co.wrap(function *() {
    yield projectRoot.dispose();
    yield builderOutputPath.dispose();
    yield output.dispose();

    // this is needed because lib/utilities/find-build-file.js does a
    // `process.chdir` when it looks for the `ember-cli-build.js`
    process.chdir(ROOT);
  }));

  (ci.APPVEYOR ? it.skip : it)('falls back to broccoli-builder@0.18 when legacy plugins exist in build', co.wrap(function *() {
    projectRoot.write({
      'ember-cli-build.js': `
        const fs = require('fs');
        const os = require('os');
        const crypto = require('crypto');

        function randomString() {
          return crypto
            .randomBytes(20)
            .toString('base64')
            .replace('+', '0')
            .replace('/', '0');
        }

        function LegacyPlugin (inputTree) {
          this.inputTree = inputTree;
          this.tmpDestDir = os.tmpdir() + '/' + randomString();
        }

        LegacyPlugin.prototype.read = function(readTree) {
          fs.mkdirSync(this.tmpDestDir); // doesn't handle rebuilds, yolo

          return readTree(this.inputTree).then(inputDir => {
            let sourceFile = inputDir + '/hello.txt';
            let destFile = this.tmpDestDir + '/hello.txt';
            let sourceContent = fs.readFileSync(sourceFile, 'utf-8');

            fs.writeFileSync(destFile, sourceContent);

            return this.tmpDestDir;
          });
        }

        module.exports = function () {
          return new LegacyPlugin(__dirname + '/app');
        }
      `,
      app: {
        'hello.txt': '// hello!',
      },
    });

    builder = new Builder({
      project,
      ui: project.ui,
      onProcessInterrupt: {
        addHandler() {},
        removeHandler() {},
      },
      outputPath: builderOutputPath.path(),
    });

    output = fromBuilder(builder);
    yield output.build();

    expect(output.read()).to.deep.equal({
      'hello.txt': '// hello!',
    });

    if (isExperimentEnabled('BROCCOLI_2')) {
      expect(builder.broccoliBuilderFallback).to.be.true;
      expect(builder.ui.output).to.include('WARNING: Invalid Broccoli2 node detected, falling back to broccoli-builder. Broccoli error:');
      expect(builder.ui.output).to.include("LegacyPlugin: The .read/.rebuild API is no longer supported as of Broccoli 1.0. Plugins must now derive from broccoli-plugin. https://github.com/broccolijs/broccoli/blob/master/docs/broccoli-1-0-plugin-api.md");
    }
  }));
});
