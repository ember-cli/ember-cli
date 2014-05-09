'use strict';

var tmp  = require('../helpers/tmp');
var conf = require('../helpers/conf');
var Promise = require('../../lib/ext/promise');
var exec = Promise.denodeify(require('child_process').exec);
var path = require('path');
var rimraf = Promise.denodeify(require('rimraf'));
var fs = require('fs');
var appName = 'some-cool-app';

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
    console.log('    runnig the slow end-to-end it will take some time');

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
});
