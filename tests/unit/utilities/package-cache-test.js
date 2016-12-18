'use strict';

var fs = require('fs-extra');
var path = require('path');
var Configstore = require('configstore');

var PackageCache = require('../../../tests/helpers/package-cache');

var td = require('testdouble');
var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;

describe('PackageCache', function() {
  var testPackageCache;

  var bower = td.function('bower');
  var npm = td.function('npm');
  var yarn = td.function('yarn');

  beforeEach(function() {
    testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    testPackageCache.__setupForTesting({
      commands: {
        bower: { invoke: bower },
        npm: { invoke: npm },
        yarn: { invoke: yarn }
      }
    });
  });

  afterEach(function() {
    td.reset();
    testPackageCache.__resetForTesting();
    fs.unlinkSync(testPackageCache._conf.path);
  });

  it('defaults rootPath', function() {
    testPackageCache = new PackageCache();
    expect(testPackageCache.rootPath).to.equal(process.cwd());

    testPackageCache = new PackageCache('./');
    expect(testPackageCache.rootPath).to.equal('./');
  });

  it('successfully uses getter/setter', function() {
    testPackageCache._conf.set('foo', true);
    expect(testPackageCache.dirs['foo']).to.be.true;
    testPackageCache._conf.delete('foo');
    expect(testPackageCache.dirs['foo']).to.be.undefined;

    expect(function() { testPackageCache.dirs = { foo: 'asdf' }; }).to.throw(Error);
  });

  it('_cleanDirs', function() {
    testPackageCache._conf.set('existing', __dirname);
    testPackageCache._conf.set('nonexisting', path.join(__dirname, 'nonexisting'));

    testPackageCache._cleanDirs();

    expect(testPackageCache.dirs['existing']).to.exist;
    expect(testPackageCache.dirs['nonexisting']).to.not.exist;
  });

  it('_readManifest', function() {
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
  });

  it('_writeManifest', function() {
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
  });

  it('_checkManifest', function() {
    var manifest = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "ember": "2.9.0",
        "ember-cli-shims": "0.1.3"
      }
    });

    var manifestShuffled = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "ember-cli-shims": "0.1.3",
        "ember": "2.9.0"
      }
    });

    testPackageCache._writeManifest('bower', 'bower', manifest);

    expect(testPackageCache._checkManifest('bower', 'bower', manifest)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', manifestShuffled)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', '{ "dependencies": "different" }')).to.be.false;

    testPackageCache.destroy('bower');
  });

  it('_removeLinks', function() {

  });

  it('_restoreLinks', function() {

  });

  describe('_install', function() {
    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.

    beforeEach(function() {
      // Fake in the dir label.
      testPackageCache._conf.set('label', 'hello');
    });

    afterEach(function() {
      td.reset();
      testPackageCache.destroy('label');
    });

    it('Triggers install.', function() {
      testPackageCache._install('label', 'npm');
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    });

    it('Attempts to link when it is supposed to.', function() {
      // Add a link.
      testPackageCache._writeManifest('label', 'npm', JSON.stringify({
        _packageCache: {
          links: ['ember-cli']
        }
      }));
      testPackageCache._install('label', 'npm');

      td.verify(npm('unlink', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm('link', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 3, ignoreExtraArgs: true });
    });

  });

  describe('_upgrade (npm)', function() {
    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.
    var testCounter = 0;
    var label;

    beforeEach(function() {
      label = 'npm-upgrade-test-' + (testCounter++);
      testPackageCache._conf.set(label, 'hello');
    });

    afterEach(function() {
      td.reset();
      testPackageCache.destroy(label);
    });

    it('Trigger upgrade.', function() {
      // npm is dumb. Upgrades are inconsistent and therefore invalid.
      // Make sure npm does an install.
      testPackageCache._upgrade(label, 'npm');
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    });

    it('Make sure npm unlinks, installs, re-links.', function() {
      // Add a link.
      testPackageCache._writeManifest(label, 'npm', JSON.stringify({
        _packageCache: {
          links: ['ember-cli']
        }
      }));
      testPackageCache._upgrade(label, 'npm');
      td.verify(npm('unlink', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm('link', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 3, ignoreExtraArgs: true });
    });

    it('Make sure multiple invocations lock out.', function() {
      testPackageCache._upgrade(label, 'npm');
      testPackageCache._upgrade(label, 'npm');
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    });

    it('locks out _upgrade after _install', function() {
      testPackageCache._install(label, 'npm');
      testPackageCache._upgrade(label, 'npm');
      td.verify(npm('install', { cwd: 'hello' }), { times: 1 });
      td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    });

  });

  describe('_upgrade (yarn)', function() {

    // This test doesn't apply to Node.js 0.12.
    if (process.version.indexOf('v0.12') === 0) { return; }

    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.
    var testCounter = 0;
    var label;

    beforeEach(function() {
      label = 'yarn-upgrade-test-' + (testCounter++);
      testPackageCache._conf.set(label, 'hello');
    });

    afterEach(function() {
      td.reset();
      testPackageCache.destroy(label);
    });

    it('Trigger upgrade.', function() {
      testPackageCache._upgrade(label, 'yarn');
      td.verify(yarn('upgrade', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn(), { times: 1, ignoreExtraArgs: true });
    });

    it('Make sure it unlinks, upgrades, re-links.', function() {
      // Add a link.
      testPackageCache._writeManifest(label, 'yarn', JSON.stringify({
        _packageCache: {
          links: ['ember-cli']
        }
      }));
      testPackageCache._upgrade(label, 'yarn');
      td.verify(yarn('unlink', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn('upgrade', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn('link', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn(), { times: 3, ignoreExtraArgs: true });
    });

    it('Make sure multiple invocations lock out.', function() {
      testPackageCache._upgrade(label, 'yarn');
      testPackageCache._upgrade(label, 'yarn');
      td.verify(yarn('upgrade', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn(), { times: 1, ignoreExtraArgs: true });
    });

    it('locks out _upgrade after _install', function() {
      testPackageCache._install(label, 'yarn');
      testPackageCache._upgrade(label, 'yarn');
      td.verify(yarn('install', { cwd: 'hello' }), { times: 1 });
      td.verify(yarn(), { times: 1, ignoreExtraArgs: true });
    });

  });

  describe('_upgrade (bower)', function() {
    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.
    var testCounter = 0;
    var label;

    beforeEach(function() {
      label = 'bower-upgrade-test-' + (testCounter++);
      testPackageCache._conf.set(label, 'hello');
    });

    afterEach(function() {
      td.reset();
      testPackageCache.destroy(label);
    });

    it('Trigger upgrade.', function() {
      testPackageCache._upgrade(label, 'bower');
      td.verify(bower('update', { cwd: 'hello' }), { times: 1 });
      td.verify(bower(), { times: 1, ignoreExtraArgs: true });
    });

    it('Make sure it unlinks, updates, re-links.', function() {
      // Add a link.
      testPackageCache._writeManifest(label, 'bower', JSON.stringify({
        _packageCache: {
          links: ['ember-cli']
        }
      }));
      testPackageCache._upgrade(label, 'bower');
      td.verify(bower('unlink', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(bower('update', { cwd: 'hello' }), { times: 1 });
      td.verify(bower('link', 'ember-cli', { cwd: 'hello' }), { times: 1 });
      td.verify(bower(), { times: 3, ignoreExtraArgs: true });
    });

    it('Make sure multiple invocations lock out.', function() {
      testPackageCache._upgrade(label, 'bower');
      testPackageCache._upgrade(label, 'bower');
      td.verify(bower('update', { cwd: 'hello' }), { times: 1 });
      td.verify(bower(), { times: 1, ignoreExtraArgs: true });
    });

    it('locks out _upgrade after _install', function() {
      testPackageCache._install(label, 'bower');
      testPackageCache._upgrade(label, 'bower');
      td.verify(bower('install', { cwd: 'hello' }), { times: 1 });
      td.verify(bower(), { times: 1, ignoreExtraArgs: true });
    });

  });

  it('create', function() {
    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    var dir = testPackageCache.create('npm', 'npm', '{}');
    var manifestFilePath = path.join(dir, 'package.json');

    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('install'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 2, ignoreExtraArgs: true });

    expect(file(manifestFilePath)).to.exist; // Sanity check.
    expect(file(manifestFilePath)).to.contain('_packageCache');
    td.reset();

    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{}');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 2, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink'), { ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm('link'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 4, ignoreExtraArgs: true });
    td.reset();

    // Correctly catches linked versions.
    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});
    testPackageCache.create('npm', 'npm', '{ "dependencies": "changed again" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink'), { ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm('link'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 4, ignoreExtraArgs: true });
  });

  it('get', function() {
    testPackageCache._conf.set('label', 'foo');
    expect(testPackageCache.get('label')).to.equal('foo');
  });

  it('destroy', function() {
    testPackageCache._writeManifest('label', 'bower', '{}');

    var dir = testPackageCache.get('label');
    var manifestFilePath = path.join(dir, 'bower.json');
    expect(file(manifestFilePath)).to.exist; // Sanity check.

    testPackageCache.destroy('label');
    expect(file(manifestFilePath)).to.not.exist;
    expect(testPackageCache.dirs['label']).to.be.undefined;
  });

  it('clone', function() {
    testPackageCache._writeManifest('from', 'bower', '{}');

    var fromDir = testPackageCache.dirs['from'];
    var toDir = testPackageCache.clone('from', 'to');

    expect(fromDir).to.not.equal(toDir);

    var fromManifest = testPackageCache._readManifest('from', 'bower');
    var toManifest = testPackageCache._readManifest('to', 'bower');

    expect(fromManifest).to.equal(toManifest);
  });

  it('downgrades on 0.12', function() {
    td.when(yarn('--version')).thenReturn({stdout: '1.0.0'});
    td.when(npm('--version')).thenReturn({stdout: '1.0.0'});

    testPackageCache.create('one', 'yarn', '{}');
    testPackageCache.create('two', 'yarn', '{}');
    testPackageCache.create('three', 'yarn', '{}');

    if (process.version.indexOf('v0.12') === 0) {
      td.verify(npm(), { times: 6, ignoreExtraArgs: true });
    } else {
      td.verify(yarn(), { times: 6, ignoreExtraArgs: true });
    }

  });

  it('succeeds at a clean install', function() {
    this.timeout(4000);

    // Intentionally turning off testing mode.
    testPackageCache.__resetForTesting();

    var manifest = JSON.stringify({
      "name": "foo",
      "dependencies": {
        "left-pad": "latest",
      }
    });

    var dir = testPackageCache.create('npm', 'npm', manifest);
    var manifestFilePath = path.join(dir, 'package.json');
    var assetPath = path.join(dir, 'node_modules', 'left-pad', 'package.json');

    // the manifest was written
    expect(file(manifestFilePath)).to.exist;

    // the dependencies were installed
    expect(file(assetPath)).to.exist;

    testPackageCache.destroy('npm');
  });

});
