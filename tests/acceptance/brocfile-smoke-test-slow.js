'use strict';

var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var fs         = require('fs-extra');
var remove     = Promise.denodeify(fs.remove);

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;
var dir = chai.dir;

var appName  = 'some-cool-app';

describe('Acceptance: brocfile-smoke-test', function() {
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
    return cleanupRun(appName).then(function() {
      expect(dir('tmp/' + appName)).to.not.exist;
    });
  });

  it('a custom EmberENV in config/environment.js is used for window.EmberENV', function() {
    return copyFixtureFiles('brocfile-tests/custom-ember-env')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var vendorContents = fs.readFileSync(path.join('dist', 'assets', 'vendor.js'), {
          encoding: 'utf8'
        });

        var expected = 'window.EmberENV = {"asdflkmawejf":";jlnu3yr23"};';
        expect(vendorContents).to.contain(expected, 'EmberENV should be in assets/vendor.js');
      });
  });

  it('a custom environment config can be used in Brocfile.js', function() {
    return copyFixtureFiles('brocfile-tests/custom-environment-config')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('without app/templates', function() {
    return copyFixtureFiles('brocfile-tests/pods-templates')
      .then(function() {
        // remove ./app/templates
        return remove(path.join(process.cwd(), 'app/templates'));
      }).then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('strips app/styles or app/templates from JS', function() {
    return copyFixtureFiles('brocfile-tests/styles-and-templates-stripped')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
          encoding: 'utf8'
        });

        expect(appFileContents).to.include('//app/templates-stuff.js');
        expect(appFileContents).to.include('//app/styles-manager.js');
      });
  });

  it('should fall back to the Brocfile', function() {
    return copyFixtureFiles('brocfile-tests/no-ember-cli-build').then(function() {
      fs.removeSync('./ember-cli-build.js');
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
    }).then(function() {
      expect(file('Brocfile.js')).to.exist;
      expect(file('ember-cli-build.js')).to.not.exist;
    });
  });

  it('should use the Brocfile if both a Brocfile and ember-cli-build exist', function() {
    return copyFixtureFiles('brocfile-tests/both-build-files').then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
    }).then(function(result) {
      var vendorContents = fs.readFileSync(path.join('dist', 'assets', 'vendor.js'), {
        encoding: 'utf8'
      });

      var expected = 'var usingBrocfile = true;';

      expect(vendorContents).to.contain(expected, 'includes file imported from Brocfile');
      expect(result.output.join('\n')).to.include('Brocfile.js has been deprecated');
    });
  });

  it('should throw if no build file is found', function() {
    fs.removeSync('./ember-cli-build.js');
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build').catch(function(err) {
      expect(err.code).to.eql(1);
    });
  });

  it('using autoRun: true', function() {
    return copyFixtureFiles('brocfile-tests/auto-run-true')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
          encoding: 'utf8'
        });

        expect(appFileContents).to.match(/\/app"\)\["default"\]\.create\(/);
      });
  });

  it('using autoRun: false', function() {

    return copyFixtureFiles('brocfile-tests/auto-run-false')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
          encoding: 'utf8'
        });

        expect(appFileContents).to.not.match(/\/app"\)\["default"\]\.create\(/);
      });
  });

  it('app.import works properly with test tree files', function() {
    return copyFixtureFiles('brocfile-tests/app-test-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-test-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'test-support.js'), {
          encoding: 'utf8'
        });

        expect(subjectFileContents).to.contain('// File for test tree imported and added via postprocessTree()');
      });
  });

  it('app.import works properly with non-js/css files', function() {
    return copyFixtureFiles('brocfile-tests/app-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'file-to-import.txt'), {
          encoding: 'utf8'
        });

        expect(subjectFileContents).to.equal('EXAMPLE TEXT FILE CONTENT\n');
      });
  });

  it('app.import fails when options.type is not `vendor` or `test`', function() {
    return expect(copyFixtureFiles('brocfile-tests/app-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-bad-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })).to.be.rejected;
  });

  it('addons can have a public tree that is merged and returned namespaced by default', function() {
    return copyFixtureFiles('brocfile-tests/public-tree')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'ember-random-addon', 'some-root-file.txt'), {
          encoding: 'utf8'
        });

        expect(subjectFileContents).to.equal('ROOT FILE\n');
      });
  });

  it('using pods based templates', function() {
    return copyFixtureFiles('brocfile-tests/pods-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('using pods based templates with a podModulePrefix', function() {
    return copyFixtureFiles('brocfile-tests/pods-with-prefix-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('addon trees are not jshinted', function() {
    return copyFixtureFiles('brocfile-tests/jshint-addon')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson['ember-addon'] = {
          paths: ['./lib/ember-random-thing']
        };

        fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--filter=jshint');
      });
  });

  it('specifying custom output paths works properly', function() {
    return copyFixtureFiles('brocfile-tests/custom-output-paths')
      .then(function () {
        var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
        return fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var files = [
          '/css/app.css',
          '/css/theme/a.css',
          '/js/app.js',
          '/css/vendor.css',
          '/js/vendor.js',
          '/css/test-support.css',
          '/js/test-support.js',
          '/my-app.html'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(f) {
          expect(file(path.join(basePath, f))).to.exist;
        });
      });
  });

  it('multiple css files in app/styles/ are output when a preprocessor is not used', function() {
    return copyFixtureFiles('brocfile-tests/multiple-css-files')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var files = [
          '/assets/some-cool-app.css',
          '/assets/other.css'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(f) {
          expect(file(path.join(basePath, f))).to.exist;
        });
      });
  });

  it('supports deprecated legacyFilesToAppend and vendorStaticFiles', function() {
    return copyFixtureFiles('brocfile-tests/app-import-with-legacy-files')
      .then(function () {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function(result) {
        expect(result.output.join('\n')).to.include('Usage of EmberApp.legacyFilesToAppend is deprecated. Please use EmberApp.import instead for the following files: \'vendor/legacy-file.js\', \'vendor/second-legacy-file.js\'');
        expect(result.output.join('\n')).to.include('Usage of EmberApp.vendorStaticStyles is deprecated. Please use EmberApp.import instead for the following files: \'vendor/legacy-file.css\'');

        expect(file('dist/assets/vendor.js')).to.contain('legacy-file.js');
        expect(file('dist/assets/vendor.js')).to.contain('second-legacy-file.js');
        expect(file('dist/assets/vendor.css')).to.contain('legacy-file.css');
      });
  });

  it('specifying outputFile results in a explicitly generated assets', function() {
    return copyFixtureFiles('brocfile-tests/app-import-output-file')
      .then(function () {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var files = [
          '/assets/output-file.js',
          '/assets/output-file.css',
          '/assets/vendor.css',
          '/assets/vendor.js'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(f) {
          expect(file(path.join(basePath, f))).to.exist;
        });
      });
  });

  // skipped because of potentially broken assertion that should be fixed correctly at a later point
  it.skip('specifying partial `outputPaths` hash deep merges options correctly', function() {
    return copyFixtureFiles('brocfile-tests/custom-output-paths')
      .then(function () {

        var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
        fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');

        var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'ember-cli-build.js');
        var brocfile = fs.readFileSync(brocfilePath, 'utf8');

        // remove outputPaths.app.js option
        brocfile = brocfile.replace(/js: '\/js\/app.js'/, '');
        // remove outputPaths.app.css.app option
        brocfile = brocfile.replace(/'app': '\/css\/app\.css',/, '');

        fs.writeFileSync(brocfilePath, brocfile, 'utf8');
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var files = [
          '/css/theme/a.css',
          '/assets/some-cool-app.js',
          '/css/vendor.css',
          '/js/vendor.js',
          '/css/test-support.css',
          '/js/test-support.js'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(f) {
          expect(file(path.join(basePath, f))).to.exist;
        });

        expect(file(path.join(basePath, '/assets/some-cool-app.css'))).to.not.exist;
      });
  });

  it('multiple paths can be CSS preprocessed', function() {
    return copyFixtureFiles('brocfile-tests/multiple-sass-files')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['broccoli-sass'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/main.css'))
          .to.equal('body { background: black; }\n', 'main.css contains correct content');

        expect(file('dist/assets/theme/a.css'))
          .to.equal('.theme { color: red; }\n', 'theme/a.css contains correct content');
      });
  });

  it('app.css is output to <app name>.css by default', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function() {
        expect(file('dist/assets/' + appName + '.css')).to.exist;
      });
  });

  // for backwards compat.
  it('app.scss is output to <app name>.css by default', function() {
    return copyFixtureFiles('brocfile-tests/multiple-sass-files')
      .then(function() {
        var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'ember-cli-build.js');
        var brocfile = fs.readFileSync(brocfilePath, 'utf8');

        // remove custom preprocessCss paths, use app.scss instead
        brocfile = brocfile.replace(/outputPaths.*/, '');

        fs.writeFileSync(brocfilePath, brocfile, 'utf8');

        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['broccoli-sass'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/' + appName + '.css'))
          .to.equal('body { background: green; }\n');
      });
  });
});
