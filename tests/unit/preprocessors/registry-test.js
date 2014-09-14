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

  it('returns array of one plugin when only one', function() {
    var plugins = registry.load('css');

    assert.equal(plugins.length, 1);
    assert.equal(plugins[0].name, 'broccoli-sass');
  });

  it('returns the correct list of plugins when there are more than one', function() {
    registry.availablePlugins['broccoli-ruby-sass'] = 'latest';
    var plugins = registry.load('css');

    assert.equal(plugins.length, 2);
    assert.equal(plugins[0].name, 'broccoli-sass');
    assert.equal(plugins[1].name, 'broccoli-ruby-sass');
  });

  it('returns plugin of the correct type', function() {
    registry.add('js', 'broccoli-coffee');
    var plugins = registry.load('js');

    assert.equal(plugins.length, 1);
    assert.equal(plugins[0].name, 'broccoli-coffee');
  });

  it('returns plugin that was in dependencies', function() {
    registry.add('template', 'broccoli-emblem');
    var plugins = registry.load('template');
    assert.equal(plugins[0].name, 'broccoli-emblem');
  });

  it('returns null when no plugin available for type', function() {
    registry.add('blah', 'not-available');
    var plugins = registry.load('blah');
    assert.equal(plugins.length, 0);
  });

  it('returns the configured extension for the plugin', function() {
    registry.add('css', 'broccoli-less-single', 'less');
    registry.availablePlugins = { 'broccoli-less-single': 'latest' };
    var plugins = registry.load('css');

    assert.equal(plugins[0].ext, 'less');
  });

  it('can specify fallback extensions', function() {
    registry.availablePlugins = { 'broccoli-ruby-sass': 'latest' };
    var plugins = registry.load('css');
    var plugin  = plugins[0];

    assert.equal(plugin.ext[0], 'scss');
    assert.equal(plugin.ext[1], 'sass');
  });

  it('provides the application name to each plugin', function() {
    registry.add('js', 'broccoli-coffee');
    var plugins = registry.load('js');

    assert.equal(plugins[0].applicationName, 'some-application-name');
  });

  it('adds a plugin directly if it is provided', function() {
    var randomPlugin = {name: 'Awesome!'};

    registry.add('js', randomPlugin);
    var registered = registry.registry['js'];

    assert.equal(registered[0], randomPlugin);
  });

  it('returns plugins added manually even if not present in package deps', function() {
    var randomPlugin = {name: 'Awesome!'};

    registry.add('foo', randomPlugin);
    var plugins = registry.load('foo');

    assert.equal(plugins[0], randomPlugin);
  });

  describe('adds a plugin directly if it is provided', function() {
    it('returns an empty array if called on an unknown type', function() {
      assert.deepEqual(registry.registeredForType('foo'), []);
    });

    it('returns the current array if type is found', function() {
      var fooArray = [ 'something', 'else' ];

      registry.registry['foo'] = fooArray;

      assert.equal(registry.registeredForType('foo'), fooArray);
    });
  });
});
