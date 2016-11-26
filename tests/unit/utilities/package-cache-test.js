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

    expect(testPackageCache.dirs['existing']).to.exist;
    expect(testPackageCache.dirs['nonexisting']).to.not.exist;

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

  it('_writeManifest', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var manifest = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "ember": "2.9.0",
        "ember-cli-shims": "0.1.3"
      }
    });

    // Confirm it writes the file.
    testPackageCache._writeManifest('bower', 'bower', manifest);
    var firstWrite = testPackageCache.dirs['bower'];
    var manifestFilePath = path.join(firstWrite, 'bower.json');
    expect(file(manifestFilePath)).to.exist;
    expect(file(manifestFilePath)).to.equal(manifest);

    // Confirm that it reuses directories.
    testPackageCache._writeManifest('bower', 'bower', manifest);
    var secondWrite = testPackageCache.dirs['bower'];
    expect(firstWrite).to.equal(secondWrite);

    // Confirm that it removes a yarn.lock file if present and type is yarn.
    testPackageCache._writeManifest('yarn', 'yarn', manifest);
    var yarn = testPackageCache.dirs['yarn'];
    var lockFileLocation = path.join(yarn, 'yarn.lock');

    // Make sure it doesn't throw if it doesn't exist.
    expect(function() { testPackageCache._writeManifest('yarn', 'yarn', manifest); }).to.not.throw(Error);

    // Add a "lockfile".
    fs.writeFileSync(lockFileLocation, 'Hello, world!');
    expect(file(lockFileLocation)).to.exist; // Sanity check.

    // Make sure it gets removed.
    testPackageCache._writeManifest('yarn', 'yarn', manifest);
    expect(file(lockFileLocation)).to.not.exist;

    testPackageCache.destroy('bower');
    testPackageCache.destroy('yarn');
    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_checkManifest', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var manifest = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "ember": "2.9.0",
        "ember-cli-shims": "0.1.3"
      }
    });

    testPackageCache._writeManifest('bower', 'bower', manifest);

    expect(testPackageCache._checkManifest('bower', 'bower', manifest)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', 'different')).to.be.false;

    testPackageCache.destroy('bower');
    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_install', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var invocations;
    testPackageCache.__setupForTesting({
      commands: {
        npm: function() { invocations.push(arguments); }
      }
    });

    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.

    // Fake in the dir label.
    testPackageCache._conf.set('label', 'hello');

    // Trigger install.
    invocations = [];
    testPackageCache._install('label', 'npm');
    expect(invocations.length).to.equal(1);
    expect(invocations[0][0]).to.equal('install');
    expect(invocations[0][1]).to.deep.equal({ cwd: 'hello' });

    // We want to make sure it attempts to link when it is supposed to.
    invocations = [];
    testPackageCache.options.linkEmberCLI = true;
    testPackageCache._install('label', 'npm');
    expect(invocations.length).to.equal(2);
    expect(invocations[0][0]).to.equal('install');
    expect(invocations[0][1]).to.deep.equal({ cwd: 'hello' });
    expect(invocations[1][0]).to.equal('link');
    expect(invocations[1][1]).to.equal('ember-cli');
    expect(invocations[1][2]).to.deep.equal({ cwd: 'hello' });

    testPackageCache.__resetForTesting();
    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('_upgrade', function() {
    var testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    var invocations;
    testPackageCache.__setupForTesting({
      commands: {
        npm: function() { invocations.push(arguments); },
        yarn: function() { invocations.push(arguments); }
      }
    });

    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.

    // Fake in the dir label.
    testPackageCache._conf.set('label', 'hello');

    // Trigger upgrade.
    invocations = [];
    testPackageCache._upgrade('label', 'yarn');
    expect(invocations.length).to.equal(1);
    expect(invocations[0][0]).to.equal('upgrade');
    expect(invocations[0][1]).to.deep.equal({ cwd: 'hello' });

    // Make sure it unlinks, upgrades, re-links.
    invocations = [];
    testPackageCache.options.linkEmberCLI = true;
    testPackageCache._upgrade('label', 'yarn');
    expect(invocations.length).to.equal(3);
    expect(invocations[0][0]).to.equal('unlink');
    expect(invocations[0][1]).to.equal('ember-cli');
    expect(invocations[0][2]).to.deep.equal({ cwd: 'hello' });
    expect(invocations[1][0]).to.equal('upgrade');
    expect(invocations[1][1]).to.deep.equal({ cwd: 'hello' });
    expect(invocations[2][0]).to.equal('link');
    expect(invocations[2][1]).to.equal('ember-cli');
    expect(invocations[2][2]).to.deep.equal({ cwd: 'hello' });

    // npm is dumb. Upgrades are inconsistent and therefore invalid.
    // Make sure it does an install.
    invocations = [];
    testPackageCache.options.linkEmberCLI = false;
    testPackageCache._upgrade('label', 'npm');
    expect(invocations.length).to.equal(1);
    expect(invocations[0][0]).to.equal('install');
    expect(invocations[0][1]).to.deep.equal({ cwd: 'hello' });

    // Make sure npm unlinks, installs, re-links.
    invocations = [];
    testPackageCache.options.linkEmberCLI = true;
    testPackageCache._upgrade('label', 'npm');
    expect(invocations.length).to.equal(3);
    expect(invocations[0][0]).to.equal('unlink');
    expect(invocations[0][1]).to.equal('ember-cli');
    expect(invocations[0][2]).to.deep.equal({ cwd: 'hello' });
    expect(invocations[1][0]).to.equal('install');
    expect(invocations[1][1]).to.deep.equal({ cwd: 'hello' });
    expect(invocations[2][0]).to.equal('link');
    expect(invocations[2][1]).to.equal('ember-cli');
    expect(invocations[2][2]).to.deep.equal({ cwd: 'hello' });

    testPackageCache.__resetForTesting();
    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('create', function() {});
  it('get', function() {});
  it('destroy', function() {});
  it('clone', function() {});

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
