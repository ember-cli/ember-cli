'use strict';

var fs           = require('fs');
var path         = require('path');
var ConfigLoader = require('../../../lib/broccoli/broccoli-config-loader');
var assert       = require('assert');
var root         = process.cwd();
var tmp          = require('tmp-sync');
var tmproot      = path.join(root, 'tmp');
var rimraf       = require('rimraf');

describe('broccoli/broccoli-config-loader', function() {
  var configLoader, tmpDestDir, tmpSrcDir,  project, options;

  beforeEach(function() {
    tmpDestDir   = tmp.in(tmproot);
    tmpSrcDir    = tmp.in(tmproot);

    project = {
      root: tmpSrcDir,
      addons: [],
      configPath: function() {
        return 'config/environment';
      },

      config: function(env) {
        return {
          env: env,
          foo: 'bar',
          baz: 'qux'
        };
      }
    };

    options = {
      env: 'development',
      tests: true,
      project: project
    };

    configLoader = new ConfigLoader('.', options);
  });

  afterEach(function() {
    rimraf.sync(tmpDestDir);
  });

  describe('updateCache', function() {
    it('writes the current environments file', function() {
      configLoader.updateCache(tmpSrcDir, tmpDestDir);

      assert(fs.existsSync(path.join(tmpDestDir, 'environment.js')));
      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'development.js')));
      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'development.json')));

      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'test.js')));
      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'test.json')));
    });

    it('does not generate test environment files if testing is disabled', function() {
      options.tests = false;
      configLoader.updateCache(tmpSrcDir, tmpDestDir);

      assert(fs.existsSync(path.join(tmpDestDir, 'environment.js')));
      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'development.js')));
      assert(fs.existsSync(path.join(tmpDestDir, 'environments', 'development.json')));

      assert(!fs.existsSync(path.join(tmpDestDir, 'environments', 'test.js')));
      assert(!fs.existsSync(path.join(tmpDestDir, 'environments', 'test.json')));
    });
  });
});
