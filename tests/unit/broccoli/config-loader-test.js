'use strict';

var fs           = require('fs');
var path         = require('path');
var ConfigLoader = require('../../../lib/broccoli/broccoli-config-loader');
var Project      = require('../../../lib/models/project');
var Promise      = require('../../../lib/ext/promise');
var assert       = require('assert');
var root         = process.cwd();
var tmp          = require('tmp-sync');
var tmproot      = path.join(root, 'tmp');
var rimraf       = Promise.denodeify(require('rimraf'));

describe('broccoli/broccoli-config-loader', function() {
  var configLoader, tmpDestDir, tmpDestDir2, tmpSrcDir,  project, options, config;

  function writeConfig(config) {
    var fileContents = 'module.exports = function() { return ' + JSON.stringify(config) + '; };';
    var configDir = path.join(tmpSrcDir, 'config');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }

    fs.writeFileSync(path.join(tmpSrcDir, 'config', 'environment.js'), fileContents, { encoding: 'utf8' });
  }

  beforeEach(function() {
    tmpDestDir   = tmp.in(tmproot);
    tmpDestDir2  = tmp.in(tmproot);
    tmpSrcDir    = tmp.in(tmproot);

    project = new Project(tmpSrcDir, {});
    project.addons = [];

    config = { foo: 'bar', baz: 'qux' };
    writeConfig(config);

    options = {
      env: 'development',
      tests: true,
      project: project
    };

    configLoader = new ConfigLoader('.', options);
  });

  afterEach(function() {
    return Promise.all([
      rimraf(tmpDestDir),
      rimraf(tmpDestDir2)
    ]);
  });

  describe('clearConfigGeneratorCache', function() {
    it('resets the cache', function() {
      configLoader.updateCache(tmpSrcDir, tmpDestDir);
      var originalConfig = fs.readFileSync(path.join(tmpDestDir, 'environment.js'), { encoding: 'utf8' });

      config.foo = 'blammo';
      writeConfig(config);
      configLoader.clearConfigGeneratorCache();

      configLoader.updateCache(tmpSrcDir, tmpDestDir2);
      var updatedConfig = fs.readFileSync(path.join(tmpDestDir2, 'environment.js'), { encoding: 'utf8' });

      assert.notEqual(originalConfig, updatedConfig);
      assert(updatedConfig.match(/blammo/));
    });
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
