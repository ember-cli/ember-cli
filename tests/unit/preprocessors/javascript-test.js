'use strict';

var assert         = require('../../helpers/assert');
var preprocessJs   = require('../../../lib/preprocessors').preprocessJs;

var registry, plugins;

describe('preprocessJs', function() {
  function generatePlugin(name, toTree) {
    return {
      name: name,
      toTree: toTree
    };
  }

  beforeEach(function() {
    registry = {
      load: function() {
        return plugins;
      }
    };
  });

  it('calls can call multiple plugins', function() {
    var pluginsCalled = [];
    var toTree = function() {
      pluginsCalled.push(this.name);
    };

    plugins = [
      generatePlugin('foo', toTree),
      generatePlugin('bar', toTree)
    ];

    preprocessJs('app', '/', 'foo.js', {
      registry: registry
    });

    assert.deepEqual(pluginsCalled, ['foo', 'bar']);
  });

  it('passes the previously returned value into the next plugin', function() {
    var treeValues = [];
    var toTree = function(tree) {
      treeValues.push(tree);

      return this.name;
    };

    plugins = [
      generatePlugin('foo', toTree),
      generatePlugin('bar', toTree)
    ];

    var output = preprocessJs('app', '/', 'foo.js', {
      registry: registry
    });

    assert.deepEqual(treeValues, ['app', 'foo']);
    assert.equal(output, 'bar');
  });
});
