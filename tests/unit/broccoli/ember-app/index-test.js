'use strict';

const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const EmberApp = require('../../../../lib/broccoli/ember-app');
const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('EmberApp.index()', function() {
  let input;

  beforeEach(function() {
    return createTempDir().then(tempDir => (input = tempDir));
  });

  afterEach(function() {
    return input.dispose();
  });

  function createApp(options) {
    options = options || {};

    let pkg = { name: 'ember-app-test' };

    let cli = new MockCLI();
    let project = new Project(input.path(), pkg, cli.ui, cli);

    return new EmberApp({
      project,
      _ignoreMissingLoader: true,
    }, options);
  }

  it('moves "app/index.html" to "index.html"', async function() {
    input.write({
      'app': {
        'index.html': 'foobar',
      },
      'config': {},
    });

    let app = createApp();
    let output = await buildOutput(app.index());

    expect(output.read()).to.deep.equal({
      'index.html': 'foobar',
    });
  });

  it('respects "outputPaths.app.html" option', async function() {
    input.write({
      'app': {
        'index.html': 'foobar',
      },
      'config': {},
    });

    let app = createApp({
      outputPaths: {
        app: {
          html: 'foo/bar.htm',
        },
      },
    });
    let output = await buildOutput(app.index());
    expect(output.read()).to.deep.equal({
      'foo': {
        'bar.htm': 'foobar',
      },
    });
  });

  it('only returns the "index.html" file', async function() {
    input.write({
      'app': {
        'bar': {
          'index.html': 'bar',
        },
        'foo.html': 'foo',
        'index.html': 'foobar',
      },
      'config': {},
    });

    let app = createApp();
    let output = await buildOutput(app.index());
    expect(output.read()).to.deep.equal({
      'index.html': 'foobar',
    });
  });

  it('replaces config patterns', async function() {
    input.write({
      'app': {
        'index.html': 'ab{{rootURL}}cd',
      },
      'config': {
        'environment.js': `module.exports = function() {
          return { rootURL: '/foo/' };
        }`,
      },
    });

    let app = createApp();
    let output = await buildOutput(app.index());
    expect(output.read()).to.deep.equal({
      'index.html': 'ab/foo/cd',
    });
  });
});
