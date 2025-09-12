'use strict';

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('JSDoc Configuration', function () {
  let configPath;
  let config;

  beforeEach(function () {
    configPath = path.join(__dirname, '../../jsdoc.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  });

  it('jsdoc.json is valid JSON', function () {
    expect(config).to.be.an('object');
  });

  it('has required source configuration', function () {
    expect(config.source).to.exist;
    expect(config.source.include).to.be.an('array');
    expect(config.source.include).to.include('./lib/');
    expect(config.source.includePattern).to.be.a('string');
    expect(config.source.exclude).to.be.an('array');
  });

  it('has required opts configuration', function () {
    expect(config.opts).to.exist;
    expect(config.opts.destination).to.equal('./docs/build/');
    expect(config.opts.readme).to.equal('./README.md');
    expect(config.opts.recurse).to.equal(true);
  });

  it('includes the version plugin', function () {
    expect(config.plugins).to.be.an('array');
    expect(config.plugins).to.include('./docs/jsdoc-version-plugin.js');
    expect(config.plugins).to.include('plugins/markdown');
  });

  it('has metadata configuration', function () {
    expect(config.metadata).to.exist;
    expect(config.metadata.title).to.equal('Ember CLI API Documentation');
    expect(config.metadata.version).to.be.a('string');
  });

  it('excludes the correct broccoli files', function () {
    const expectedExcludes = [
      'node_modules/',
      './lib/broccoli/app-boot.js',
      './lib/broccoli/app-config.js',
      './lib/broccoli/app-prefix.js',
      './lib/broccoli/app-suffix.js',
      './lib/broccoli/test-support-prefix.js',
      './lib/broccoli/test-support-suffix.js',
      './lib/broccoli/vendor-prefix.js',
      './lib/broccoli/vendor-suffix.js',
      './lib/broccoli/tests-prefix.js',
      './lib/broccoli/tests-suffix.js'
    ];

    expectedExcludes.forEach(exclude => {
      expect(config.source.exclude).to.include(exclude);
    });
  });

  it('version plugin file exists', function () {
    const pluginPath = path.join(__dirname, '../../docs/jsdoc-version-plugin.js');
    expect(fs.existsSync(pluginPath)).to.be.true;
  });
});
