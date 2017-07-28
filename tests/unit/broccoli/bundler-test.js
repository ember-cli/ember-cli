'use strict';

const co = require('co');
const chai = require('chai');
const Bundler = require('../../../lib/broccoli/bundler');
const walkSync = require('walk-sync');
const broccoliTestHelper = require('broccoli-test-helper');

const expect = chai.expect;
const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Bundler', function() {
  describe('constructor', function() {
    it('should set properties', function() {
      let bundler = new Bundler({
        name: 'the-best-app-ever',
        sourcemaps: { enabled: true },
        appOutputPath: 'the-best-app-ever.js',
      });

      expect(bundler.name).to.equal('the-best-app-ever');
      expect(bundler.sourcemaps).to.deep.equal({ enabled: true });
      expect(bundler.appOutputPath).to.equal('the-best-app-ever.js');
    });
  });

  describe('bundleAppJs', function() {
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
        },
      });
    }));

    afterEach(function() {
      input.dispose();
    });

    it('given a tree with `addon` and `vendor` produces a final tree with one javascript file and sourcemap associated with it', co.wrap(function *() {
      let bundler = new Bundler({
        name: 'the-best-app-ever',
        sourcemaps: { enabled: true },
        appOutputPath: 'the-best-app-ever.js',
        appTreeAnnotation: 'concat yo',
      });

      let output = yield buildOutput(bundler.bundleJs(input.path(), {
        annotation: 'concatinatin\' silly trees',
      }));

      let files = walkSync(output.path(), { directories: false });
      expect(files).to.deep.equal([
        'the-best-app-ever.js',
        'the-best-app-ever.map',
      ]);
    }));
  });
});
