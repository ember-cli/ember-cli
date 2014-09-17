'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var ncp        = Promise.denodeify(require('ncp'));
var assert     = require('assert');
var EOL        = require('os').EOL;

var runCommand       = require('../helpers/run-command');
var buildApp         = require('../helpers/build-app');
var copyFixtureFiles = require('../helpers/copy-fixture-files');

var appName  = 'some-cool-app';

describe('Acceptance: brocfile-smoke-test', function() {
  before(function() {
    this.timeout(360000);

    return tmp.setup('./common-tmp')
      .then(function() {
        process.chdir('./common-tmp');

        conf.setup();
        return buildApp(appName)
          .then(function() {
            return rimraf(path.join(appName, 'node_modules', 'ember-cli'));
          });
      });
  });

  after(function() {
    this.timeout(10000);

    return tmp.teardown('./common-tmp')
      .then(function() {
        conf.restore();
      });
  });

  beforeEach(function() {
    this.timeout(10000);

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

        fs.symlinkSync(path.join(pwd, '..'), appsECLIPath);

        process.chdir(appName);
      });
  });

  afterEach(function() {
    this.timeout(10000);

    return tmp.teardown('./tmp');
  });

  it('using wrapInEval: true', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/wrap-in-eval')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('default development build tests', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/default-development')
    .then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });
  });

  it('app.import works properly with non-js/css files', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/app-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
          verbose: true
        });
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'file-to-import.txt'), { encoding: 'utf8' });

        assert.equal(subjectFileContents, 'EXAMPLE TEXT FILE CONTENT' + EOL);
      });
  });

  it('addons can have a public tree that is merged and returned namespaced by default', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/public-tree')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
          verbose: true
        });
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'ember-random-addon', 'some-root-file.txt'), { encoding: 'utf8' });

        assert.equal(subjectFileContents, 'ROOT FILE' + EOL);
      });
  });

  it('using pods based templates', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/pods-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('using pods based templates with a podModulePrefix', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/pods-with-prefix-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('addon trees are not jshinted', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/jshint-addon')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson['ember-addon'] = {
          paths: ['./lib/ember-random-thing']
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

        var horribleRoute = 'var blah = ""' + EOL + 'export default Blah;';
        var horribleRoutePath = path.join('.', 'lib', 'ember-random-thing', 'app',
                                          'routes', 'horrible-route.js');

        fs.writeFileSync(horribleRoutePath, horribleRoute);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('specifying custom output paths works properly', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/custom-output-paths')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
          verbose: true
        });
      })
      .then(function() {
        var files = [
          '/css/app.css',
          '/js/app.js',
          '/css/vendor.css',
          '/js/vendor.js',
          '/css/test-support.css',
          '/js/test-support.js'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(file) {
          assert(fs.existsSync(path.join(basePath, file)), file + ' exists');
        });
      });
  });
});

