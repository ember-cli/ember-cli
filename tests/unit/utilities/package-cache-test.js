'use strict';

const fs = require('fs-extra');
const path = require('path');
const Configstore = require('configstore');

const PackageCache = require('../../../tests/helpers/package-cache');
const symlinkOrCopySync = require('symlink-or-copy').sync;

const td = require('testdouble');
const chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;

describe('PackageCache', function() {
  let testPackageCache;

  let bower = td.function('bower');
  let npm = td.function('npm');
  let yarn = td.function('yarn');

  beforeEach(function() {
    testPackageCache = new PackageCache();
    testPackageCache._conf = new Configstore('package-cache-test');

    testPackageCache.__setupForTesting({
      commands: {
        bower: { invoke: bower },
        npm: { invoke: npm },
        yarn: { invoke: yarn },
      },
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

    expect(() => {
      testPackageCache.dirs = { foo: 'asdf' };
    }).to.throw(Error);
  });

  it('_cleanDirs', function() {
    testPackageCache._conf.set('existing', __dirname);
    testPackageCache._conf.set('nonexisting', path.join(__dirname, 'nonexisting'));

    testPackageCache._cleanDirs();

    expect(testPackageCache.dirs['existing']).to.exist;
    expect(testPackageCache.dirs['nonexisting']).to.not.exist;
  });

  it('_readManifest', function() {
    let emberCLIPath = path.resolve(__dirname, '../../..');
    testPackageCache._conf.set('self', emberCLIPath);
    testPackageCache._conf.set('boom', __dirname);

    let manifest;
    manifest = JSON.parse(testPackageCache._readManifest('self', 'yarn'));
    expect(manifest.name).to.equal('ember-cli');

    manifest = testPackageCache._readManifest('nonexistent', 'yarn');
    expect(manifest).to.be.null;

    testPackageCache._readManifest('boom', 'yarn');
    expect(manifest).to.be.null;
  });

  it('_writeManifest', function() {
    let manifest = JSON.stringify({
      name: 'foo',
      dependencies: {
        ember: '2.9.0',
        'ember-cli-shims': '0.1.3',
      },
    });

    // Confirm it writes the file.
    testPackageCache._writeManifest('bower', 'bower', manifest);
    let firstWrite = testPackageCache.dirs['bower'];
    let manifestFilePath = path.join(firstWrite, 'bower.json');
    expect(file(manifestFilePath)).to.exist;
    expect(file(manifestFilePath)).to.equal(manifest);

    // Confirm that it reuses directories.
    testPackageCache._writeManifest('bower', 'bower', manifest);
    let secondWrite = testPackageCache.dirs['bower'];
    expect(firstWrite).to.equal(secondWrite);

    // Confirm that it removes a yarn.lock file if present and type is yarn.
    testPackageCache._writeManifest('yarn', 'yarn', manifest);
    let yarn = testPackageCache.dirs['yarn'];
    let lockFileLocation = path.join(yarn, 'yarn.lock');

    // Make sure it doesn't throw if it doesn't exist.
    expect(() => {
      testPackageCache._writeManifest('yarn', 'yarn', manifest);
    }).to.not.throw(Error);

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
    let manifest = JSON.stringify({
      name: 'foo',
      dependencies: {
        ember: '2.9.0',
        'ember-cli-shims': '0.1.3',
      },
    });

    let manifestShuffled = JSON.stringify({
      name: 'foo',
      dependencies: {
        'ember-cli-shims': '0.1.3',
        ember: '2.9.0',
      },
    });

    let manifestEmptyKey = JSON.stringify({
      name: 'foo',
      dependencies: {
        ember: '2.9.0',
        'ember-cli-shims': '0.1.3',
      },
      devDependencies: {},
    });

    testPackageCache._writeManifest('bower', 'bower', manifest);

    expect(testPackageCache._checkManifest('bower', 'bower', manifest)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', manifestShuffled)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', manifestEmptyKey)).to.be.true;
    expect(testPackageCache._checkManifest('bower', 'bower', '{ "dependencies": "different" }')).to.be.false;

    testPackageCache.destroy('bower');
  });

  it('_removeLinks', function() {
    // This is our package that is linked in.
    let srcDir = path.join(process.cwd(), 'tmp', 'beta');
    expect(dir(srcDir)).to.not.exist;
    fs.outputFileSync(path.join(srcDir, 'package.json'), 'beta');
    expect(file(path.join(srcDir, 'package.json'))).to.contain('beta');

    // This is the directory we got "back" from `PackageCache.create`.
    let targetDir = path.join(process.cwd(), 'tmp', 'target');
    expect(dir(targetDir)).to.not.exist;
    testPackageCache._conf.set('label', targetDir);
    fs.mkdirsSync(targetDir);
    expect(dir(targetDir)).to.exist;

    // This is the directory which would be created as a link.
    let eventualDir = path.join(targetDir, 'node_modules', 'beta');
    fs.mkdirsSync(path.dirname(eventualDir));
    expect(dir(path.dirname(eventualDir))).to.exist;
    expect(dir(eventualDir)).to.not.exist;

    // Link or copy in the package.
    symlinkOrCopySync(srcDir, eventualDir);
    expect(file(path.join(eventualDir, 'package.json'))).to.contain('beta');

    let manifest = {
      _packageCache: {
        links: ['one', 'two', 'three', 'alpha', { name: 'beta', path: srcDir }],
      },
      dependencies: {
        beta: '1.0.0',
        one: '1.0.0',
        two: '2.0.0',
        three: '3.0.0',
        four: '4.0.0', // Doesn't remove non-linked items.
      },
      devDependencies: {
        one: '1.0.0', // Handles duplicates correctly.
      },
    };

    let result = {
      _packageCache: {
        links: [
          'one',
          'two',
          'three',
          'alpha', // Will blindly unlink alpha.
          { name: 'beta', path: srcDir },
        ],
        originals: {
          dependencies: {
            beta: '1.0.0',
            one: '1.0.0',
            two: '2.0.0',
            three: '3.0.0',
            four: '4.0.0',
          },
          devDependencies: {
            one: '1.0.0',
          },
        },
      },
      dependencies: {
        four: '4.0.0',
      },
      devDependencies: {},
    };

    let readManifest = td.function('_readManifest');
    td.when(readManifest('label', 'npm')).thenReturn(JSON.stringify(manifest));
    testPackageCache._readManifest = readManifest;

    let writeManifest = td.function('_writeManifest');
    testPackageCache._writeManifest = writeManifest;

    testPackageCache._removeLinks('label', 'npm');
    td.verify(writeManifest('label', 'npm', JSON.stringify(result)), { times: 1, ignoreExtraArgs: true });

    td.verify(npm('unlink', 'one'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink', 'two'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink', 'three'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink', 'alpha'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink'), { times: 4, ignoreExtraArgs: true });

    // Confirms manual unlink behavior.
    expect(dir(eventualDir)).to.not.exist;

    // Ensures we don't delete the other side of the symlink.
    expect(dir(srcDir)).to.exist;

    // Clean up.
    fs.removeSync(srcDir);
    fs.removeSync(targetDir);
  });

  it('_restoreLinks', function() {
    // This is our package that is linked in.
    let srcDir = path.join(process.cwd(), 'tmp', 'beta');
    expect(dir(srcDir)).to.not.exist;
    fs.outputFileSync(path.join(srcDir, 'package.json'), 'beta');
    expect(file(path.join(srcDir, 'package.json'))).to.contain('beta');

    // This is the directory we got "back" from `PackageCache.create`.
    let targetDir = path.join(process.cwd(), 'tmp', 'target');
    expect(dir(targetDir)).to.not.exist;
    testPackageCache._conf.set('label', targetDir);
    fs.mkdirsSync(targetDir);
    expect(dir(targetDir)).to.exist;

    // This is the directory which will be created as a link.
    let eventualDir = path.join(targetDir, 'node_modules', 'beta');
    expect(dir(eventualDir)).to.not.exist;

    let manifest = {
      _packageCache: {
        links: ['one', 'two', 'three', 'alpha', { name: 'beta', path: srcDir }],
        originals: {
          dependencies: {
            beta: '1.0.0',
            one: '1.0.0',
            two: '2.0.0',
            three: '3.0.0',
            four: '4.0.0',
          },
          devDependencies: {
            one: '1.0.0',
          },
        },
      },
      dependencies: {
        four: '4.0.0',
      },
      devDependencies: {},
    };

    let result = {
      _packageCache: {
        links: [
          'one',
          'two',
          'three',
          'alpha', // Will blindly link alpha.
          { name: 'beta', path: srcDir },
        ],
      },
      dependencies: {
        beta: '1.0.0',
        one: '1.0.0',
        two: '2.0.0',
        three: '3.0.0',
        four: '4.0.0', // Order matters!
      },
      devDependencies: {
        one: '1.0.0', // Restores duplicates.
      },
    };

    let readManifest = td.function('_readManifest');
    td.when(readManifest('label', 'npm')).thenReturn(JSON.stringify(manifest));
    testPackageCache._readManifest = readManifest;

    let writeManifest = td.function('_writeManifest');
    testPackageCache._writeManifest = writeManifest;

    testPackageCache._restoreLinks('label', 'npm');
    td.verify(writeManifest('label', 'npm', JSON.stringify(result)), { times: 1, ignoreExtraArgs: true });

    td.verify(npm('link', 'one'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('link', 'two'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('link', 'three'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('link', 'alpha'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('link'), { times: 4, ignoreExtraArgs: true });

    // Confirms manual link behavior.
    expect(dir(srcDir)).to.exist;
    expect(file(path.join(eventualDir, 'package.json'))).to.contain('beta');

    // Clean up.
    fs.removeSync(srcDir);
    fs.removeSync(targetDir);
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
      testPackageCache._writeManifest(
        'label',
        'npm',
        JSON.stringify({
          _packageCache: {
            links: ['ember-cli'],
          },
        })
      );
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
    let testCounter = 0;
    let label;

    beforeEach(function() {
      label = `npm-upgrade-test-${testCounter++}`;
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
      testPackageCache._writeManifest(
        label,
        'npm',
        JSON.stringify({
          _packageCache: {
            links: ['ember-cli'],
          },
        })
      );
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
    // We're only going to test the invocation pattern boundary.
    // Don't want to wait for the install to execute.
    let testCounter = 0;
    let label;

    beforeEach(function() {
      label = `yarn-upgrade-test-${testCounter++}`;
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
      testPackageCache._writeManifest(
        label,
        'yarn',
        JSON.stringify({
          _packageCache: {
            links: ['ember-cli'],
          },
        })
      );
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
    let testCounter = 0;
    let label;

    beforeEach(function() {
      label = `bower-upgrade-test-${testCounter++}`;
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
      testPackageCache._writeManifest(
        label,
        'bower',
        JSON.stringify({
          _packageCache: {
            links: ['ember-cli'],
          },
        })
      );
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
    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    let dir = testPackageCache.create('npm', 'npm', '{}');
    let manifestFilePath = path.join(dir, 'package.json');

    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('install'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 2, ignoreExtraArgs: true });

    expect(file(manifestFilePath)).to.exist; // Sanity check.
    expect(file(manifestFilePath)).to.contain('_packageCache');
    td.reset();

    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{}');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 2, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }');
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink'), { ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm('link'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 4, ignoreExtraArgs: true });
    td.reset();

    // Correctly catches linked versions.
    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{ "dependencies": "different" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm(), { times: 1, ignoreExtraArgs: true });
    td.reset();

    td.when(npm('--version')).thenReturn({ stdout: '1.0.0' });
    testPackageCache.create('npm', 'npm', '{ "dependencies": "changed again" }', ['ember-cli']);
    td.verify(npm('--version'), { times: 1, ignoreExtraArgs: true });
    td.verify(npm('unlink'), { ignoreExtraArgs: true });
    td.verify(npm('install'), { ignoreExtraArgs: true });
    td.verify(npm('link'), { ignoreExtraArgs: true });
    td.verify(npm(), { times: 4, ignoreExtraArgs: true });

    // Clean up.
    testPackageCache.destroy('npm');
  });

  it('get', function() {
    testPackageCache._conf.set('label', 'foo');
    expect(testPackageCache.get('label')).to.equal('foo');
  });

  it('destroy', function() {
    testPackageCache._writeManifest('label', 'bower', '{}');

    let dir = testPackageCache.get('label');
    let manifestFilePath = path.join(dir, 'bower.json');
    expect(file(manifestFilePath)).to.exist; // Sanity check.

    testPackageCache.destroy('label');
    expect(file(manifestFilePath)).to.not.exist;
    expect(testPackageCache.dirs['label']).to.be.undefined;
  });

  it('clone', function() {
    testPackageCache._writeManifest('from', 'bower', '{}');

    let fromDir = testPackageCache.dirs['from'];
    let toDir = testPackageCache.clone('from', 'to');

    expect(fromDir).to.not.equal(toDir);

    let fromManifest = testPackageCache._readManifest('from', 'bower');
    let toManifest = testPackageCache._readManifest('to', 'bower');

    expect(fromManifest).to.equal(toManifest);

    // Clean up.
    testPackageCache.destroy('from');
    testPackageCache.destroy('to');
  });

  it('succeeds at a clean install', function() {
    this.timeout(15000);

    // Intentionally turning off testing mode.
    testPackageCache.__resetForTesting();

    let manifest = JSON.stringify({
      name: 'foo',
      dependencies: {
        'left-pad': 'latest',
      },
    });

    let dir = testPackageCache.create('npm', 'npm', manifest);
    let manifestFilePath = path.join(dir, 'package.json');
    let assetPath = path.join(dir, 'node_modules', 'left-pad', 'package.json');

    // the manifest was written
    expect(file(manifestFilePath)).to.exist;

    // the dependencies were installed
    expect(file(assetPath)).to.exist;

    testPackageCache.destroy('npm');
  });
});
