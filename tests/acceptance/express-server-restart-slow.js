'use strict';

var path       = require('path');
var assert     = require('assert');
var fs         = require('fs');
var walkSync   = require('walk-sync');
var EOL        = require('os').EOL;
var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var buildApp   = require('../helpers/build-app');
var runCommand = require('../helpers/run-command');
var Promise    = require('../../lib/ext/promise');
var ncp        = Promise.denodeify(require('ncp'));
var rimraf     = Promise.denodeify(require('rimraf'));
var symlink    = Promise.denodeify(fs.symlink);
var copyFixtureFiles = require('../helpers/copy-fixture-files');

function assertTmpEmpty() {
  var paths = walkSync('./tmp')
    .filter(function(path) {
      return !path.match(/output\//);
    });

  assert(paths.length === 0, 'tmp/ should be empty after `ember` tasks. Contained: ' + paths.join(EOL));
}

describe('Acceptance: express server restart', function () {
  var appName = 'express-server-restart-test-app';

  before(function() {
    this.timeout(360000);

    return tmp.setup('./common-tmp')
      .then(function() {
        process.chdir('./common-tmp');

        conf.setup();
        return buildApp(appName);
      }).then(function() {
        return rimraf(path.join(appName, 'node_modules', 'ember-cli'));
      }).then(function() {
        process.chdir(appName);
        return copyFixtureFiles('restart-express-server/app-root');
      });
  });

  after(function() {
    this.timeout(15000);

    return tmp.teardown('./common-tmp')
      .then(function() {
        conf.restore();
      });
  });

  var appRoot;
  beforeEach(function() {
    this.timeout(15000);

    return tmp.setup('./tmp')
      .then(function() {
        return ncp('./common-tmp/' + appName, './tmp/' + appName, {
          clobber: true,
          stopOnErr: true
        });
      })
      .then(function() {
        process.chdir('./tmp');

        var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');
        var pwd = process.cwd();

        return symlink(path.join(pwd, '..'), appsECLIPath);
      }).then(function () {
        process.chdir(appName);
        appRoot = process.cwd();
      });
  });

  afterEach(function() {
    this.timeout(15000);

    process.chdir(appRoot);
    assertTmpEmpty();
    return tmp.teardown('./tmp');
  });

  function getRunCommandOptions(onChildSpawned) {
    return {
      onChildSpawned: onChildSpawned,
      killAfterChildSpawnedPromiseResolution: true
    };
  }

  var initialRoot = process.cwd();
  function ensureTestFileContents(expectedContents, message) {
    var contents = fs.readFileSync(path.join(initialRoot, 'tmp', appName, 'foo.txt'), { encoding: 'utf8' });
    assert.equal(contents, expectedContents, message);
  }

  function onChildSpawnedSingleCopy(copySrc, expectedContents) {
    return function() {
      process.chdir('server');
      return delay(6000)
        .then(function() {
          ensureTestFileContents('Initial contents of A.', 'Test file has correct contents after initial server start.');
          return copyFixtureFiles(path.join('restart-express-server', copySrc));
        }).then(function() {
          return delay(4000);
        }).then(function() {
          ensureTestFileContents(expectedContents, 'Test file has correct contents after first copy.');
        });
    };
  }

  function onChildSpawnedMultipleCopies() {
    return function() {
      process.chdir('server');
      return delay(6000)
        .then(function() {
          ensureTestFileContents('Initial contents of A.', 'Test file has correct contents after initial server start.');
          return copyFixtureFiles(path.join('restart-express-server', 'copy1'));
        }).then(function() {
          return delay(4000);
        }).then(function() {
          ensureTestFileContents('Copy1 contents of A.', 'Test file has correct contents after first copy.');
          return copyFixtureFiles(path.join('restart-express-server', 'copy2'));
        }).then(function() {
          return delay(4000);
        }).then(function() {
          ensureTestFileContents('Copy2 contents of A. Copy2 contents of B.', 'Test file has correct contents after second copy.');
          return rimraf(path.join('restart-express-server', 'subfolder'));
        }).then(function() {
          return copyFixtureFiles(path.join('restart-express-server', 'copy3'));
        }).then(function() {
          return delay(4000);
        }).then(function() {
          ensureTestFileContents('true true', 'Test file has correct contents after second copy.');
        });
    };
  }

  function runServer(commandOptions) {
    return new Promise(function(resolve, reject) {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'serve', '--live-reload-port', '32580', '--port', '49741', commandOptions)
        .then(function() {
          throw new Error('The server should not have exited successfully.');
        })
        .catch(function(err) {
          if (err.testingError) {
            return reject(err.testingError);
          }

          // This error was just caused by us having to kill the program
          return resolve();
        });
    });
  }

  it('Server restarts successfully on copy1', function() {
    this.timeout(30000);

    ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
    return runServer(getRunCommandOptions(onChildSpawnedSingleCopy('copy1', 'Copy1 contents of A.')));
  });

  it('Server restarts successfully on copy2', function() {
    this.timeout(30000);

    ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
    return runServer(getRunCommandOptions(onChildSpawnedSingleCopy('copy2', 'Copy2 contents of A. Copy2 contents of B.')));
  });

  it('Server restarts successfully on multiple copies', function() {
    this.timeout(60000);

    ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
    return runServer(getRunCommandOptions(onChildSpawnedMultipleCopies()));
  });
});

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
