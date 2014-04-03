'use strict';

var assert = require('../../helpers/assert');
var PluginRegistry = require('../../../lib/preprocessors/registry');

var pkg, registry;

describe('Plugin Loader', function() {

  beforeEach(function() {
    pkg = {
      devDependencies: {
        'broccoli-sass': 'latest',
        'broccoli-coffee': 'latest'
      }
    };
    registry = new PluginRegistry(pkg.devDependencies);
    registry.add('css', 'broccoli-sass');
    registry.add('css', 'broccoli-ruby-sass');
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

  it('returns null when no plugin available for type', function() {
    registry.add('blah', 'not-available');
    var plugin = registry.load('blah');
    assert.notOk(plugin, 'loaded a plugin that wasn\'t in dependencies');
  });
});
