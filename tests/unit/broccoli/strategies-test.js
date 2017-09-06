'use strict';

const expect = require('chai').expect;
const strategies = require('../../../lib/broccoli/strategies');

const createVendorJsStrategy = strategies.createVendorJsStrategy;
const createApplicationJsStrategy = strategies.createApplicationJsStrategy;

describe('assembler strategies', function() {
  it('concatenate strategy for application\'s javascript is generated correctly', function() {
    let strategy = createApplicationJsStrategy({
      name: 'the-best-app-ever',
      annotation: 'the-best-app-ever concat',
      sourceMapConfig: { enabled: true },
      outputFile: 'the-best-app-ever.js',
    });

    expect(strategy).to.deep.equal({
      options: {
        annotation: 'the-best-app-ever concat',
        footerFiles: [
          'vendor/ember-cli/app-suffix.js',
          'vendor/ember-cli/app-config.js',
          'vendor/ember-cli/app-boot.js',
        ],
        headerFiles: [
          'vendor/ember-cli/app-prefix.js',
        ],
        inputFiles: [
          'the-best-app-ever/**/*.js',
        ],
        outputFile: 'the-best-app-ever.js',
        sourceMapConfig: {
          'enabled': true,
        },
      },
    });
  });

  it('concatenate strategy for application\'s vendor javascript is generated correctly', function() {
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
    let strategy = createVendorJsStrategy({
      files: scriptOutputFiles['/assets/vendor.js'],
      annotation: 'the-best-app-ever vendor concat',
      sourceMapConfig: { enabled: true },
      outputFile: '/assets/vendor.js',
    });

    expect(strategy).to.deep.equal({
      options: {
        annotation: 'the-best-app-ever vendor concat',
        footerFiles: [],
        headerFiles: [
          'vendor/ember-cli/vendor-prefix.js',
          'vendor/loader/loader.js',
          'vendor/ember/jquery/jquery.js',
          'vendor/ember/ember.debug.js',
          'vendor/ember-cli-shims/app-shims.js',
          'vendor/ember-resolver/legacy-shims.js',
        ],
        inputFiles: [],
        outputFile: '/assets/vendor.js',
        sourceMapConfig: {
          'enabled': true,
        },
      },
    });
  });
});
