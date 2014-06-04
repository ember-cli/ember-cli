'use strict';

var tmp      = require('../helpers/tmp');
var conf     = require('../helpers/conf');
var Promise  = require('../../lib/ext/promise');
var exec     = Promise.denodeify(require('child_process').exec);
var path     = require('path');
var rimraf   = Promise.denodeify(require('rimraf'));
var fs       = require('fs');
var crypto   = require('crypto');
var assert   = require('assert');
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';

describe('Acceptance: smoke-test', function() {
  before(conf.setup);

  after(conf.restore);

  beforeEach(function() {
    tmp.setup('./tmp');
    process.chdir('./tmp');
  });

  afterEach(function() {
    tmp.teardown('./tmp');
  });

  it('ember new foo, clean from scratch', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(360000);

    var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');

    return exec('pwd').then(function(pwd) {
      return exec(path.join('..', 'bin', 'ember') + ' new ' + appName).then(function() {
        return rimraf(appsECLIPath).then(function() {
          fs.symlinkSync(path.join(pwd, '..'), appsECLIPath);

          process.chdir(appName);

          return exec(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember') + ' test').then(console.log);
        });
      });
    }).finally(function() {
      console.log('done!');
    });
  });

  it('ember new foo, build production and verify fingerprint', function() {
    console.log('    running the slow fingerprint it will take some time');

    this.timeout(360000);

    var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');
    var globalPwd = null;

    return exec('pwd').then(function(pwd) {
      globalPwd = pwd;

      return exec(path.join('..', 'bin', 'ember') + ' new ' + appName);
    }).then(function() {
      return rimraf(appsECLIPath);
    }).then(function() {
      fs.symlinkSync(path.join(globalPwd, '..'), appsECLIPath);

      process.chdir(appName);

      return exec(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember') + ' build --environment=production');
    }).then(function() {
      var dirPath = path.join('.', 'dist', 'assets');
      var dir = fs.readdirSync(dirPath);
      var files = [];

      dir.forEach(function (filepath) {
        if (filepath === '.gitkeep') {
          return;
        }

        files.push(filepath);

        var file = fs.readFileSync(path.join(dirPath, filepath), { encoding: 'utf8' });

        var md5 = crypto.createHash('md5');
        md5.update(file);
        var hex = md5.digest('hex');

        var possibleNames = [appName + '-' + hex + '.js', appName + '-' + hex + '.css', 'vendor-' + hex + '.css'];
        assert(possibleNames.indexOf(filepath) > -1);
      });

      var indexHtml = fs.readFileSync(path.join('.', 'dist', 'index.html'), { encoding: 'utf8' });

      files.forEach(function (filename) {
        assert(indexHtml.indexOf(filename) > -1);
      });
    }).finally(function() {
      console.log('done');
    });
  });

  it('ember new foo, build development, and verify generated files', function() {
    console.log('    running the slow build tests');

    this.timeout(360000);

    var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');
    var globalPwd = null;

    return exec('pwd').then(function(pwd) {
      globalPwd = pwd;

      return exec(path.join('..', 'bin', 'ember') + ' new ' + appName);
    }).then(function() {
      return rimraf(appsECLIPath);
    }).then(function() {
      fs.symlinkSync(path.join(globalPwd, '..'), appsECLIPath);

      process.chdir(appName);

      return exec(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember') + ' build');
    }).then(function() {
      var dirPath = path.join('.', 'dist');
      var paths = walkSync(dirPath);

      assert(paths.length < 20);
    }).finally(function() {
      console.log('done');
    });
  });
});
