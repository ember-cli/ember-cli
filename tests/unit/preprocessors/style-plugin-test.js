'use strict';

var assert      = require('../../helpers/assert');
var StylePlugin = require('../../../lib/preprocessors/style-plugin');

describe('Style Plugin', function(){
  describe('constructor', function(){
    var plugin;
    var options;
    before(function(){
      options = {
        paths: ['some/path'],
        registry: 'some/registry',
        applicationName: 'some/application'
      };
      plugin = new StylePlugin('california-stylesheets', 'cass', options);
    });
    it('sets type', function(){
      assert.equal(plugin.type, 'css');
    });
    it('sets name', function(){
      assert.equal(plugin.name, 'california-stylesheets');
    });
    it('sets ext', function(){
      assert.equal(plugin.ext, 'cass');
    });
    it('sets options', function(){
      assert.equal(plugin.options, options);
    });
    it('sets registry', function(){
      assert.equal(plugin.registry, 'some/registry');
    });
    it('sets applicationName', function(){
      assert.equal(plugin.applicationName, 'some/application');
    });
  });
});

