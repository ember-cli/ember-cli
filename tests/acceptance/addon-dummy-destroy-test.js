/*jshint quotmark: false*/

'use strict';

var Promise    = require('../../lib/ext/promise');
var expect     = require('chai').expect;
var assertFile = require('../helpers/assert-file');
var conf       = require('../helpers/conf');
var ember      = require('../helpers/ember');
var existsSync = require('exists-sync');
var fs         = require('fs-extra');
var path       = require('path');
var remove     = Promise.denodeify(fs.remove);
var root       = process.cwd();
var tmp        = require('tmp-sync');
var tmproot    = path.join(root, 'tmp');

var BlueprintNpmTask = require('../helpers/disable-npm-on-blueprint');

describe('Acceptance: ember destroy in-addon-dummy', function() {
  this.timeout(20000);

  var tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM();
    conf.setup();
  });

  after(function() {
    BlueprintNpmTask.restoreNPM();
    conf.restore();
  });

  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initAddon() {
    return ember([
      'addon',
      'my-addon',
      '--skip-npm',
      '--skip-bower'
    ]);
  }

  function generateInAddon(args) {
    var generateArgs = ['generate'].concat(args);

    return initAddon().then(function() {
      return ember(generateArgs);
    });
  }

  function destroy(args) {
    var destroyArgs = ['destroy'].concat(args);
    return ember(destroyArgs);
  }

  function assertFileNotExists(file) {
    var filePath = path.join(process.cwd(), file);
    expect(!existsSync(filePath), 'expected ' + file + ' not to exist');
  }

  function assertFilesExist(files) {
    files.forEach(assertFile);
  }

  function assertFilesNotExist(files) {
    files.forEach(assertFileNotExists);
  }

  function assertDestroyAfterGenerateInAddonDummy(args, files) {
    args = args.concat('--dummy');

    return initAddon()
      .then(function() {
        return generateInAddon(args);
      })
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function(result) {
        expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
        assertFilesNotExist(files);
      });
  }

  it('dummy route foo', function() {
    var commandArgs = ['route', 'foo'];
    var files       = [
      'tests/dummy/app/routes/foo.js'
    ];

    return assertDestroyAfterGenerateInAddonDummy(commandArgs, files)
      .then(function() {
        assertFile('tests/dummy/app/router.js', {
          doesNotContain: "this.route('foo');"
        });
      });
  });

  it('dummy route foo/bar', function() {
    var commandArgs = ['route', 'foo/bar'];
    var files       = [
      'tests/dummy/app/routes/foo/bar.js'
    ];

    return assertDestroyAfterGenerateInAddonDummy(commandArgs, files)
      .then(function() {
        assertFile('tests/dummy/app/router.js', {
          doesNotContain: "this.route('bar');"
        });
      });
  });
});
