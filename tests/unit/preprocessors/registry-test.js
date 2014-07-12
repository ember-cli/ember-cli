'use strict';

var assign         = require('lodash-node/modern/objects/assign');
var assert         = require('../../helpers/assert');
var PluginRegistry = require('../../../lib/preprocessors/registry');

var pkg, registry, app;

describe('Plugin Loader', function() {

  beforeEach(function() {
    pkg = {
      dependencies: {
        'broccoli-emblem': 'latest'
      },
      devDependencies: {
        'broccoli-sass': 'latest',
        'broccoli-coffee': 'latest'
      }
    };

    app = { name: 'some-application-name' };
    registry = new PluginRegistry(assign(pkg.devDependencies, pkg.dependencies), app);
    registry.add('css', 'broccoli-sass', ['scss', 'sass']);
    registry.add('css', 'broccoli-ruby-sass', ['scss', 'sass']);
  });

  it('returns first plugin when only one', function() {
    var plugin = registry.load('css');
    assert.equal(plugin.name, 'broccoli-sass');
  });

  it('returns the correct plugin when there are more than one', function() {
    registry.availablePlugins = { 'broccoli-ruby-sass': 'latest' };
    var plugin = registry.load('css');
    assert.equal(plugin.name, 'broccoli-ruby-sass');
  });

  it('returns plugin of the correct type', function() {
    registry.add('js', 'broccoli-coffee');
    var plugin = registry.load('js');
    assert.equal(plugin.name, 'broccoli-coffee');
  });

  it('returns plugin that was in dependencies', function() {
    registry.add('template', 'broccoli-emblem');
    var plugin = registry.load('template');
    assert.equal(plugin.name, 'broccoli-emblem');
  });

  it('returns null when no plugin available for type', function() {
    registry.add('blah', 'not-available');
    var plugin = registry.load('blah');
    assert.notOk(plugin, 'loaded a plugin that wasn\'t in dependencies');
  });

  it('returns the configured extension for the plugin', function() {
    registry.add('css', 'broccoli-less-single', 'less');
    registry.availablePlugins = { 'broccoli-less-single': 'latest' };
    var plugin = registry.load('css');
    assert.equal(plugin.ext, 'less');
  });

  it('can specify fallback extensions', function() {
    registry.availablePlugins = { 'broccoli-ruby-sass': 'latest' };
    var plugin = registry.load('css');
    assert.equal(plugin.ext[0], 'scss');
    assert.equal(plugin.ext[1], 'sass');
  });

  it('provides the application name to each plugin', function() {
    registry.add('js', 'broccoli-coffee');
    var plugin = registry.load('js');

    assert.equal(plugin.applicationName, 'some-application-name');
  });

  it('adds a plugin directly if it is provided', function() {
    var randomPlugin = {name: 'Awesome!'};

    registry.add('js', randomPlugin);
    var registered = registry.registry['js'];

    assert.equal(registered[0], randomPlugin);
  });

});
