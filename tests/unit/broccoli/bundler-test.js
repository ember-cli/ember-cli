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
        vendorFilePath: 'assets/vendor.js',
        isBabelAvailable: false,
      });

      expect(bundler.name).to.equal('the-best-app-ever');
      expect(bundler.sourcemaps).to.deep.equal({ enabled: true });
      expect(bundler.appOutputPath).to.equal('the-best-app-ever.js');
      expect(bundler.vendorFilePath).to.equal('assets/vendor.js');
      expect(bundler.isBabelAvailable).to.equal(false);
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

    it('given a tree with `addon` and `vendor` produces a final tree with application and vendor javascript and sourcemaps associated with them', co.wrap(function *() {
      let bundler = new Bundler({
        name: 'the-best-app-ever',
        sourcemaps: { enabled: true },
        appOutputPath: 'the-best-app-ever.js',
        vendorFilePath: 'assets/vendor.js',
        appTreeAnnotation: 'concat yo',
      });

      let scriptOutputFiles = {
        '/assets/vendor.js': [
          'vendor/ember-cli/vendor-prefix.js',
          'vendor/loader/loader.js',
          'vendor/ember/jquery/jquery.js',
          'vendor/ember/ember.debug.js',
          'vendor/ember-cli-shims/app-shims.js',
          'vendor/ember-resolver/legacy-shims.js',
        ],
      };

      let output = yield buildOutput(bundler.bundleJs(input.path(), {
        scriptOutputFiles,
      }));

      let files = walkSync(output.path(), { directories: false });
      expect(files).to.deep.equal([
        'assets/vendor.js',
        'assets/vendor.map',
        'the-best-app-ever.js',
        'the-best-app-ever.map',
      ]);
    }));

    it('vendor files are correctly ordered within concatenated vendor tree', function() {
      let bundler = new Bundler({
        name: 'the-best-app-ever',
        sourcemaps: { enabled: true },
        appOutputPath: 'the-best-app-ever.js',
        appTreeAnnotation: 'concat yo',
        vendorFilePath: '/assets/vendor.js',
      });

      let vendorFileList = [
        'vendor/ember-cli/vendor-prefix.js',
        'files/d.js',
        'files/a.js',
        'bower_components/jquery/dist/jquery.js',
        'bower_components/ember/ember.js',
        'bower_components/ember-cli-shims/app-shims.js',
        'files/b.js',
        'files/c.js',
      ];
      let scriptOutputFiles = {
        '/assets/vendor.js': vendorFileList,
      };

      let vendorFiles = bundler.getVendorFiles(scriptOutputFiles);

      expect(vendorFiles.headerFiles).to.deep.equal(vendorFileList);
      expect(vendorFiles.inputFiles).to.deep.equal([
        'addon-tree-output/**/*.js',
      ]);
      expect(vendorFiles.footerFiles).to.deep.equal([
        'vendor/ember-cli/vendor-suffix.js',
      ]);
      expect(vendorFiles.annotation).to.equal('Vendor JS');
    });
  });
});
