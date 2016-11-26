'use strict';

var fs = require('fs-extra');
var path = require('path');
var Configstore = require('configstore');

var PackageCache = require('../../../lib/utilities/package-cache');

var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;

describe('PackageCache', function() {

  it('defaults options', function() {
    var testPackageCache;
    testPackageCache = new PackageCache();
    expect(testPackageCache.options.linkEmberCLI).to.be.false;

    testPackageCache = new PackageCache({});
    expect(testPackageCache.options.linkEmberCLI).to.be.false;

    testPackageCache = new PackageCache({ linkEmberCLI: false });
    expect(testPackageCache.options.linkEmberCLI).to.be.false;

    testPackageCache = new PackageCache({ linkEmberCLI: true });
    expect(testPackageCache.options.linkEmberCLI).to.be.true;
  });

  it('successfully uses getter/setter', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    testPackageCache._conf.set('foo', true);
    expect(testPackageCache.dirs['foo']).to.be.true;
    testPackageCache._conf.delete('foo');
    expect(testPackageCache.dirs['foo']).to.be.undefined;

    expect(function() { testPackageCache.dirs = { foo: 'asdf' }; }).to.throw(Error);

    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_cleanDirs', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    testPackageCache._conf.set('existing', __dirname);
    testPackageCache._conf.set('nonexisting', path.join(__dirname, 'nonexisting'));

    testPackageCache._cleanDirs();

    expect(testPackageCache.dirs.existing).to.exist;
    expect(testPackageCache.dirs.nonexisting).to.not.exist;

    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_readManifest', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var emberCLIPath = path.resolve(__dirname, '../../..');
    testPackageCache._conf.set('self', emberCLIPath);
    testPackageCache._conf.set('boom', __dirname);

    var manifest;
    manifest = JSON.parse(testPackageCache._readManifest('self', 'yarn'));
    expect(manifest.name).to.equal('ember-cli');

    manifest = testPackageCache._readManifest('nonexistent', 'yarn');
    expect(manifest).to.equal.null;

    testPackageCache._readManifest('boom', 'yarn');
    expect(manifest).to.equal.null;

    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_checkManifest', function() {});
  it('_writeManifest', function() {});
  it('_install', function() {});
  it('_upgrade', function() {});

  it('succeeds at a clean install', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var manifest = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "ember": "2.9.0",
        "ember-cli-shims": "0.1.3"
      }
    });

    var dir = testPackageCache.create('bower', 'bower', manifest);
    var manifestFilePath = path.join(dir, 'bower.json');
    var assetPath = path.join(dir, 'bower_components', 'ember', 'bower.json');

    // the manifest was written
    expect(file(manifestFilePath)).to.exist;

    // checkManifest confirms identical
    expect(testPackageCache._checkManifest('bower', 'bower', manifest)).to.be.true;

    // the dependencies were installed
    expect(file(assetPath)).to.exist;

    // RESET!
    testPackageCache._conf = new Configstore('package-cache-test');

    // succeeds in reusing existing data
    expect(testPackageCache._checkManifest('bower', 'bower', manifest)).to.be.true;



    // Remove the stub Configstore.
    fs.unlinkSync(testPackageCache._conf.path);
  });

});

// var contents = require('./blueprint-shim');
// test.create('app-node', 'yarn', contents['app']['package.json']);
// test.create('addon-node', 'yarn', contents['addon']['package.json']);
// test.create('app-bower', 'bower', contents['app']['bower.json']);
// test.create('addon-bower', 'bower', contents['addon']['bower.json']);

