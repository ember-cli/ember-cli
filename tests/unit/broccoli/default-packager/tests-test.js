'use strict';

const p = require('ember-cli-preprocess-registry/preprocessors');
const co = require('co');
const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Tests', function() {
  let input, output;
  let name = 'the-best-app-ever';

  let project = {
    dependencies() {
      return {
        'ember-cli-htmlbars': '^2.0.1',
      };
    },
    addons: [],
  };

  let TESTS = {
    acceptance: {},
    helpers: {},
    'index.html': 'index',
    integration: {},
    'test-helper.js': 'test-helper',
    unit: {},
  };

  before(co.wrap(function *() {
    input = yield createTempDir();

    input.write(TESTS);
  }));

  after(co.wrap(function *() {
    yield input.dispose();
  }));

  afterEach(co.wrap(function *() {
    yield output.dispose();
  }));

  it('caches packaged tests tree', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      registry: p.defaultRegistry(project),
    });

    expect(defaultPackager._cachedTests).to.equal(null);

    output = yield buildOutput(defaultPackager.packageTests(input.path()));

    expect(defaultPackager._cachedTests).to.not.equal(null);
    expect(defaultPackager._cachedTests._annotation).to.equal('Packaged Tests');
  }));

  it('packages tests files', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      registry: p.defaultRegistry(project),
    });

    output = yield buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      [name]: {
        tests: TESTS,
      },
    });
  }));
});
