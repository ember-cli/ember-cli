'use strict';

const co = require('co');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const EmberApp = require('../../../../lib/broccoli/ember-app');
const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const walkSync = require('walk-sync');
const stew = require('broccoli-stew');

describe('EmberApp#test', function() {
  let input;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();

    input.write({
      'config': {
        'environment.js': `module.exports = function() { return { modulePrefix: 'test-app' }; };`,
      },
    });
  }));

  afterEach(function() {
    return input.dispose();
  });

  function createApp(options) {
    options = options || {};

    let pkg = { name: 'ember-app-test' };

    let cli = new MockCLI();
    let project = new Project(input.path(), pkg, cli.ui, cli);

    let app = new EmberApp({
      project,
      name: pkg.name,
      _ignoreMissingLoader: true,
      sourcemaps: { enabled: false },
    }, options);

    app._compileAddonTemplates = tree => tree;

    return app;
  }

  it('emits dist/assets/tests.js by default', co.wrap(function *() {
    input.write({
      'tests': {
        'test-helper.js': '// test-helper.js',
      },
    });

    let app = createApp();
    let output = yield buildOutput(app.test());

    let files = walkSync(output.path(), { directories: false });
    expect(files).to.deep.equal([
      'assets/test-support.js',
      'assets/tests.js',
      'testem.js',
    ]);
  }));

  it('lintTree results do not "win" over app tests', co.wrap(function *() {
    input.write({
      'app': { },
      'tests': {
        'integration': {
          'components': {
            'foo-bar-test.js': '// foo-bar-test.js',
          },
        },
      },
    });

    let app = createApp();

    // create a fake addon that has a `lintTree`
    app.project.addons.push({
      // this lintTree implementation will return the same
      // files as the input tree, but the contents will be
      // different
      lintTree(type, tree) {
        return stew.map(tree, string => string.toUpperCase());
      },
    });

    let output = yield buildOutput(app.test());

    // confirm this contains the original value
    // unmodified by the `lintTree` added above
    expect(output.read().assets['tests.js']).to.include('// foo-bar-test.js');
  }));
});
