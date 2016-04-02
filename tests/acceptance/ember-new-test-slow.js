'use strict';

var path     = require('path');
var fs       = require('fs');
var crypto   = require('crypto');
var expect   = require('chai').expect;
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';
var EOL      = require('os').EOL;
var mkdirp   = require('mkdirp');

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var killCliProcess      = require('../helpers/kill-cli-process');
var assertDirEmpty      = require('ember-cli-internal-test-helpers/lib/helpers/assert-dir-empty');
var ember               = require('../helpers/ember');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

describe('Acceptance: `ember new` smoke test', function() {
  this.timeout(500000);
  before(function() {
    return createTestTargets(appName);
  });

  after(function() {
    return teardownTestTargets();
  });

  beforeEach(function() {
    return linkDependencies(appName);
  });

  afterEach(function() {
    delete process.env._TESTEM_CONFIG_JS_RAN;

    return cleanupRun().then(function() {
      assertDirEmpty('tmp');
    });
  });

  it('ember new foo, clean from scratch', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('ember new foo, make sure addon template overwrites', function() {
    return ember(['generate', 'template', 'foo'])
      .then(function() {
        return ember(['generate', 'in-repo-addon', 'my-addon']);
      })
      .then(function() {
        // this should work, but generating a template in an addon/in-repo-addon doesn't
        // do the right thing: update once https://github.com/ember-cli/ember-cli/issues/5687
        // is fixed
        //return ember(['generate', 'template', 'foo', '--in-repo-addon=my-addon']);

        // temporary work around
        var templatePath = path.join('lib', 'my-addon', 'app', 'templates', 'foo.hbs');
        mkdirp.sync(path.dirname(templatePath));
        fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });
      })
      .then(function() {
        var packageJsonPath = path.join('lib','my-addon','package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies['ember-cli-htmlbars'] = '*';

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
          .then(function(result) {
            expect(result.code).to.equal(0);
          })
          .catch(function() {
            expect(false, 'should not have rejected with an error').to.be.ok;
          });
      });
  });

  // there is a bug in here when running the entire suite on Travis
  // when run in isolation, it passes
  // here is the error:
  // test-support-80f2fe63fae0c44478fe0f8af73200a7.js contains the fingerprint (2871106928f813936fdd64f4d16005ac): expected 'test-support-80f2fe63fae0c44478fe0f8af73200a7.js' to include '2871106928f813936fdd64f4d16005ac'
  it.skip('ember new foo, build production and verify fingerprint', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
      .then(function() {
        var dirPath = path.join('.', 'dist', 'assets');
        var dir = fs.readdirSync(dirPath);
        var files = [];

        dir.forEach(function (filepath) {
          if (filepath === '.gitkeep') {
            return;
          }

          files.push(filepath);

          var file = fs.readFileSync(path.join(dirPath, filepath), { encoding: null });

          var md5 = crypto.createHash('md5');
          md5.update(file);
          var hex = md5.digest('hex');

          expect(filepath).to.contain(hex, filepath + ' contains the fingerprint (' + hex + ')');
        });

        var indexHtml = fs.readFileSync(path.join('.', 'dist', 'index.html'), { encoding: 'utf8' });

        files.forEach(function (filename) {
          expect(indexHtml).to.contain(filename);
        });
      });
  });

  it('ember new foo, build production and verify single "use strict";', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
      .then(function() {
        var dirPath = path.join('.', 'dist', 'assets');
        var dir = fs.readdirSync(dirPath);
        var appNameRE = new RegExp(appName + '-([a-f0-9]+)\\.js','i');
        dir.forEach(function(filepath) {
          if (appNameRE.test(filepath)) {
            var contents = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
            var count = (contents.match(/(["'])use strict\1;/g) || []).length;
            expect(count).to.equal(1);
          }
        });
      });
  });

  it('ember new foo, build development, and verify generated files', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function() {
        var dirPath = path.join('.', 'dist');
        var paths = walkSync(dirPath);

        expect(paths).to.have.length.below(23, 'expected fewer than 23 files in dist, found ' + paths.length);
      });
  });

  it('ember new foo, build --watch development, and verify rebuilt after change', function() {
    var touched     = false;
    var appJsPath   = path.join('.', 'app', 'app.js');
    var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
    var text        = 'anotuhaonteuhanothunaothanoteh';
    var line        = 'console.log("' + text + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput: function(string, child) {
        if (touched) {
          if (string.match(/Build successful/)) {
            // build after change to app.js
            var contents  = fs.readFileSync(builtJsPath).toString();
            expect(contents).to.contain(text, 'must contain changed line after rebuild');
            killCliProcess(child);
          }
        } else {
          if (string.match(/Build successful/)) {
            // first build
            touched = true;
            fs.appendFileSync(appJsPath, line);
          }
        }
      }
    }).catch(function() {
      // swallowing because of SIGINT
    });
  });

  it('ember new foo, build --watch development, and verify rebuilt after multiple changes', function() {
    var buildCount  = 0;
    var touched     = false;
    var appJsPath   = path.join('.', 'app', 'app.js');
    var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
    var firstText   = 'anotuhaonteuhanothunaothanoteh';
    var firstLine   = 'console.log("' + firstText + '");';
    var secondText  = 'aahsldfjlwioruoiiononociwewqwr';
    var secondLine  = 'console.log("' + secondText + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput: function(string, child) {
        if (buildCount === 0) {
          if (string.match(/Build successful/)) {
            // first build
            touched = true;
            buildCount = 1;
            fs.appendFileSync(appJsPath, firstLine);
          }
        } else if (buildCount === 1) {
          if (string.match(/Build successful/)) {
            // second build
            touched = true;
            buildCount = 2;
            fs.appendFileSync(appJsPath, secondLine);
          }
        } else if (touched && buildCount === 2) {
          if (string.match(/Build successful/)) {
            // build after change to app.js
            var contents  = fs.readFileSync(builtJsPath).toString();
            expect(contents.indexOf(secondText), 'must contain second changed line after rebuild').to.be.above(1);
            killCliProcess(child);
          }
        }
      }
    }).catch(function() {
      // swallowing because of SIGINT
    });
  });

  it('ember new foo, server, SIGINT clears tmp/', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323','--live-reload=false', {
      onOutput: function(string, child) {
        if (string.match(/Build successful/)) {
          killCliProcess(child);
        }
      }
    }).catch(function() {
      // just eat the rejection as we are testing what happens
    });
  });

  it('ember new foo, build production and verify css files are concatenated', function() {
    return copyFixtureFiles('with-styles').then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          var dirPath = path.join('.', 'dist', 'assets');
          var dir = fs.readdirSync(dirPath);
          var cssNameRE = new RegExp(appName + '-([a-f0-9]+)\\.css','i');
          dir.forEach(function (filepath) {
            if (cssNameRE.test(filepath)) {
              var appCss = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
              expect(appCss).to.contain('.some-weird-selector');
              expect(appCss).to.contain('.some-even-weirder-selector');
            }
          });
        });
    });
  });
});
