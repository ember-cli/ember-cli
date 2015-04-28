'use strict';

var fs           = require('fs-extra');
var path         = require('path');
var ConfigLoader = require('../../../lib/broccoli/broccoli-config-loader');
var Project      = require('../../../lib/models/project');
var Promise      = require('../../../lib/ext/promise');
var expect       = require('chai').expect;
var root         = process.cwd();
var tmp          = require('tmp-sync');
var tmproot      = path.join(root, 'tmp');
var remove       = Promise.denodeify(fs.remove);

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
      remove(tmpDestDir),
      remove(tmpDestDir2)
    ]);
  });

  describe('clearConfigGeneratorCache', function() {
    it('resets the cache', function() {
      configLoader.updateCache(tmpSrcDir, tmpDestDir);
      var originalConfig = fs.readFileSync(path.join(tmpDestDir, 'environments', 'development.json'), { encoding: 'utf8' });

      config.foo = 'blammo';
      writeConfig(config);

      configLoader.updateCache(tmpSrcDir, tmpDestDir2);
      var updatedConfig = fs.readFileSync(path.join(tmpDestDir2, 'environments', 'development.json'), { encoding: 'utf8' });

      expect(originalConfig, 'config/environment.json should have been updated').to.not.equal(updatedConfig);

      expect(true, updatedConfig.match(/blammo/));
    });
  });

  describe('updateCache', function() {
    it('writes the current environments file', function() {
      configLoader.updateCache(tmpSrcDir, tmpDestDir);

      expect(true, fs.existsSync(path.join(tmpDestDir, 'environments', 'development.json')));
      expect(true, fs.existsSync(path.join(tmpDestDir, 'environments', 'test.json')));
    });

    it('does not generate test environment files if testing is disabled', function() {
      options.tests = false;
      configLoader.updateCache(tmpSrcDir, tmpDestDir);

      expect(true, fs.existsSync(path.join(tmpDestDir, 'environments', 'development.json')));
      expect(true, !fs.existsSync(path.join(tmpDestDir, 'environments', 'test.json')));
    });
  });
});
