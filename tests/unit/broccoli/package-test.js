'use strict';

const co = require('co');
const packagerFor = require('../../../lib/broccoli/packager-for');
const broccoliTestHelper = require('broccoli-test-helper');
const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

const expect = require('chai').expect;

describe('Packager', function() {
  let input;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();

    input.write({
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
    });
  }));

  afterEach(function() {
    input.dispose();
  });

  it('produces a default dist tree', co.wrap(function *() {
    let emberApp = {
      name: 'the-best-app-ever',
      _scriptOutputFiles: {
        '/assets/vendor.js': [
          'vendor/ember-cli/vendor-prefix.js',
          'vendor/loader/loader.js',
          'vendor/ember/jquery/jquery.js',
          'vendor/ember/ember.debug.js',
          'vendor/ember-cli-shims/app-shims.js',
          'vendor/ember-resolver/legacy-shims.js',
        ],
      },
      options: {
        outputPaths: {
          app: {
            js: '/assets/the-best-app-ever.js',
          },
          vendor: {
            js: '/assets/vendor.js',
          },
        },
        sourcemaps: {
          enabled: true,
        },
      },
    };

    let packageFn = packagerFor(emberApp);

    let finalTreeOutput = yield buildOutput(packageFn(input.path()));
    let finalTreeOutputInfo = finalTreeOutput.read();

    expect(Object.keys(finalTreeOutputInfo.assets)).to.deep.equal([
      'the-best-app-ever.js',
      'the-best-app-ever.map',
      'vendor.js',
      'vendor.map',
    ]);
  }));
});
