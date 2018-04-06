'use strict';

const co = require('co');
const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Javascript', function() {
  let input, output;

  let scriptOutputFiles = {
    '/assets/vendor.js': [
      'vendor/ember-cli/vendor-prefix.js',
      'vendor/loader/loader.js',
      'vendor/ember/jquery/jquery.js',
      'vendor/ember-cli-shims/app-shims.js',
      'vendor/ember-resolver/legacy-shims.js',
      'vendor/ember/ember.debug.js',
    ],
  };
  let MODULES = {
    'addon-tree-output': {
      'ember-ajax': {
        'request.js': '',
      },
      'ember-cli-app-version': {
        'initializer-factory.js': '',
      },
      'modules': {
        'ember-data': {
          'transform.js': '',
          'store.js': '',
        },
      },
    },
    'the-best-app-ever': {
      'router.js': 'router.js',
      'app.js': 'app.js',
      'components': {
        'x-foo.js': 'x-foo.js',
      },
      'config': {
        'environment.js': 'environment.js',
      },
    },
    'vendor': {
      'loader': {
        'loader.js': '',
      },
      'ember': {
        'jquery': {
          'jquery.js': '',
        },
        'ember.debug.js': '',
      },
      'ember-cli': {
        'app-boot.js': 'app-boot.js',
        'app-config.js': 'app-config.js',
        'app-prefix.js': 'app-prefix.js',
        'app-suffix.js': 'app-suffix.js',
        'test-support-prefix.js': 'test-support-prefix.js',
        'test-support-suffix.js': 'test-support-suffix.js',
        'tests-prefix.js': 'tests-prefix.js',
        'tests-suffix.js': 'tests-suffix.js',
        'vendor-prefix.js': 'vendor-prefix.js',
        'vendor-suffix.js': 'vendor-suffix.js',
      },
      'ember-cli-shims': {
        'app-shims.js': '',
      },
      'ember-resolver': {
        'legacy-shims.js': '',
      },
    },
  };

  before(co.wrap(function *() {
    input = yield createTempDir();

    input.write(MODULES);
  }));

  after(co.wrap(function *() {
    yield input.dispose();
  }));

  afterEach(co.wrap(function *() {
    yield output.dispose();
  }));

  it('caches packaged javascript tree', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },
      scriptOutputFiles,
    });

    expect(defaultPackager._cachedJavascript).to.equal(null);

    output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

    expect(defaultPackager._cachedJavascript).to.not.equal(null);
    expect(defaultPackager._cachedJavascript._annotation).to.equal('Packaged Javascript');
  }));

  it('packages javascript files with sourcemaps on', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },
      scriptOutputFiles,
    });

    output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles.assets)).to.deep.equal([
      'the-best-app-ever.js',
      'the-best-app-ever.map',
      'vendor.js',
      'vendor.map',
    ]);
  }));

  it('packages javascript files with sourcemaps off', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },
      scriptOutputFiles,
      sourcemaps: {
        enabled: false,
      },
    });

    output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles.assets)).to.deep.equal([
      'the-best-app-ever.js',
      'vendor.js',
    ]);
  }));
});
