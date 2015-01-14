'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var ncp        = Promise.denodeify(require('ncp'));
var expect     = require('chai').expect;
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
    this.timeout(15000);

    return tmp.teardown('./common-tmp')
      .then(function() {
        conf.restore();
      });
  });

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

        fs.symlinkSync(path.join(pwd, '..'), appsECLIPath, 'junction');

        process.chdir(appName);
      });
  });

  afterEach(function() {
    this.timeout(15000);

    return tmp.teardown('./tmp');
  });

  it('a custom EmberENV in config/environment.js is used for window.EmberENV', function() {
    this.timeout(450000);


    return copyFixtureFiles('brocfile-tests/custom-ember-env')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/custom-environment-config')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('using wrapInEval: true', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/wrap-in-eval')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('without app/templates', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/pods-templates')
      .then(function(){
        // remove ./app/templates
        return rimraf(path.join(process.cwd(), 'app/templates'));
      }).then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('using autoRun: true', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/auto-run-true')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
          encoding: 'utf8'
        });

        expect(appFileContents).to.match(/\/app"\)\["default"\]\.create\(/);
      });
  });

  it('using autoRun: false', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/auto-run-false')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
          encoding: 'utf8'
        });

        expect(appFileContents).to.not.match(/\/app"\)\["default"\]\.create\(/);
      });
  });

  it('default development build tests', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/default-development')
    .then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
    });
  });

  it('app.import works properly with non-js/css files', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/app-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'file-to-import.txt'), {
          encoding: 'utf8'
        });

        expect(subjectFileContents).to.equal('EXAMPLE TEXT FILE CONTENT' + EOL);
      });
  });

  it('app.import fails when options.type is not `vendor` or `test`', function(){
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/app-import')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
        packageJson.devDependencies['ember-bad-addon'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        expect(false, 'Build passed when it should have failed!');
      }, function() {
        expect(true, 'Build failed with invalid options type.');
      });
  });

  it('addons can have a public tree that is merged and returned namespaced by default', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/public-tree')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
        packageJson.devDependencies['ember-random-addon'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'ember-random-addon', 'some-root-file.txt'), {
          encoding: 'utf8'
        });

        expect(subjectFileContents).to.equal('ROOT FILE' + EOL);
      });
  });

  it('using pods based templates', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/pods-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('using pods based templates with a podModulePrefix', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/pods-with-prefix-templates')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('addon trees are not jshinted', function() {
    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/jshint-addon')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
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
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('specifying custom output paths works properly', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/custom-output-paths')
      .then(function () {
        // copy app.css to theme.css
        var appCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'app.css');
        var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
        var appCSS = fs.readFileSync(appCSSPath);
        return fs.writeFileSync(themeCSSPath, appCSS);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
        files.forEach(function(file) {
          expect(fs.existsSync(path.join(basePath, file)), file + ' exists');
        });
      });
  });

  it('multiple css files in app/styles/ are output when a preprocessor is not used', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/multiple-css-files')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var files = [
          '/assets/some-cool-app.css',
          '/assets/other.css'
        ];

        var basePath = path.join('.', 'dist');
        files.forEach(function(file) {
          expect(fs.existsSync(path.join(basePath, file)), file + ' exists');
        });
      });
  });

  it('specifying partial `outputPaths` hash deep merges options correctly', function() {

    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/custom-output-paths')
      .then(function () {
        // copy app.css to theme.css
        var appCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'app.css');
        var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
        var appCSS = fs.readFileSync(appCSSPath);

        fs.writeFileSync(themeCSSPath, appCSS);

        var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'Brocfile.js');
        var brocfile = fs.readFileSync(brocfilePath, 'utf8');

        // remove outputPaths.app.js option
        brocfile = brocfile.replace(/js: '\/js\/app.js'/, '');
        // remove outputPaths.app.css.app option
        brocfile = brocfile.replace(/'app': '\/css\/app\.css',/, '');

        fs.writeFileSync(brocfilePath, brocfile, 'utf8');
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
        files.forEach(function(file) {
          expect(fs.existsSync(path.join(basePath, file)), file + ' exists');
        });

        expect(!fs.existsSync(path.join(basePath, '/assets/some-cool-app.css')), 'default app.css should not exist');
      });
  });

  it('multiple paths can be CSS preprocessed', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/multiple-sass-files')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson.devDependencies['broccoli-sass'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'main.css'), {
          encoding: 'utf8'
        });
        var themeCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'theme', 'a.css'), {
          encoding: 'utf8'
        });

        expect(mainCSS).to.equal('body { background: black; }' + EOL, 'main.css contains correct content');
        expect(themeCSS).to.equal('.theme { color: red; }' + EOL, 'theme/a.css contains correct content');
      });
  });

  it('app.css is output to <app name>.css by default', function() {
    this.timeout(100000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent')
      .then(function() {
        var exists = fs.existsSync(path.join('.', 'dist', 'assets', appName + '.css'));

        expect(exists, appName + '.css exists');
      });
  });

  // for backwards compat.
  it('app.scss is output to <app name>.css by default', function() {
    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/multiple-sass-files')
      .then(function() {
        var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'Brocfile.js');
        var brocfile = fs.readFileSync(brocfilePath, 'utf8');

        // remove custom preprocessCss paths, use app.scss instead
        brocfile = brocfile.replace(/outputPaths.*/, '');

        fs.writeFileSync(brocfilePath, brocfile, 'utf8');

        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson.devDependencies['broccoli-sass'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
      })
      .then(function() {
        var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.css'), {
          encoding: 'utf8'
        });

        expect(mainCSS).to.equal('body { background: green; }' + EOL, appName + '.css contains correct content');
      });
  });
});
