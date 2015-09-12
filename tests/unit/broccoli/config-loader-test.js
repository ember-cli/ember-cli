'use strict';

var fs           = require('fs');
var path         = require('path');
var ConfigLoader = require('../../../lib/broccoli/broccoli-config-loader');
var Project      = require('../../../lib/models/project');
var existsSync   = require('exists-sync');
var expect       = require('chai').expect;
var root         = process.cwd();
var tmp          = require('tmp-sync');
var tmproot      = path.join(root, 'tmp');
var Builder      = require('broccoli').Builder;

describe('broccoli/broccoli-config-loader', function() {
  var tmpSrcDir, configDir, project, options, config, builder;

  function writeConfig(config) {
    var fileContents = 'module.exports = function() { return ' + JSON.stringify(config) + '; };';

    if (!existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }

    fs.writeFileSync(path.join(tmpSrcDir, 'config', 'environment.js'), fileContents, { encoding: 'utf8' });
  }

  beforeEach(function() {
    tmpSrcDir = tmp.in(tmproot);
    configDir = path.join(tmpSrcDir, 'config');

    project = new Project(tmpSrcDir, {});
    project.addons = [];

    config = { foo: 'bar', baz: 'qux' };
    writeConfig(config);

    options = {
      env: 'development',
      tests: true,
      project: project
    };
  });

  afterEach(function() {
    if (builder) {
      return builder.cleanup();
    }
  });

  describe('clearConfigGeneratorCache', function() {
    it('resets the cache', function() {
      var originalConfig, updatedConfig;

      builder = new Builder(new ConfigLoader(configDir, options));

      return builder.build().then(function(result) {
        originalConfig = fs.readFileSync(path.join(result.directory, 'environments', 'development.json'), { encoding: 'utf8' });
      }).then(function() {
        config.foo = 'blammo';
        writeConfig(config);
        return builder.build();
      }).then(function(result) {
        updatedConfig = fs.readFileSync(path.join(result.directory, 'environments', 'development.json'), { encoding: 'utf8' });
        expect(originalConfig, 'config/environment.json should have been updated').to.not.equal(updatedConfig);
        expect(updatedConfig).to.match(/blammo/);
      });
    });
  });

  describe('updateCache', function() {
    it('writes the current environments file', function() {
      builder = new Builder(new ConfigLoader(configDir, options));

      return builder.build().then(function(result) {
        expect(existsSync(path.join(result.directory, 'environments', 'development.json'))).to.be.true;
        expect(existsSync(path.join(result.directory, 'environments', 'test.json'))).to.be.true;
      });
    });

    it('does not generate test environment files if testing is disabled', function() {
      options.tests = false;
      builder = new Builder(new ConfigLoader(configDir, options));

      return builder.build().then(function(result) {
        expect(existsSync(path.join(result.directory, 'environments', 'development.json'))).to.be.true;
        expect(existsSync(path.join(result.directory, 'environments', 'test.json'))).to.be.false;
      });
    });
  });
});
