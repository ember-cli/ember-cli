'use strict';

var fs        = require('fs');
var path      = require('path');
var deprecate = require('../utilities/deprecate');
var assign    = require('lodash-node/modern/objects/assign');

function Addon(project) {
  this.project = project;
}

Addon.__proto__ = require('./core-object');
Addon.prototype.constructor = Addon;

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

Addon.prototype.treePaths = {
  app:       'app',
  styles:    'app/styles',
  templates: 'app/templates',
  vendor:    'vendor'
};

Addon.prototype.treeFor = function treeFor(name) {
  var treePath = path.join(this._root, this.treePaths[name]);

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

Addon.resolvePath = function(addon) {
  var addonMain;

  deprecate(addon.pkg.name + ' is using the deprecated ember-addon-main definition. It should be updated to {\'ember-addon\': {\'main\': \'' + addon.pkg['ember-addon-main'] + '\'}}', addon.pkg['ember-addon-main']);

  addonMain = addon.pkg['ember-addon-main'] || addon.pkg['ember-addon'].main || 'index.js';

  // Resolve will fail unless it has an extension
  if(!path.extname(addonMain)) {
    addonMain += '.js';
  }

  return path.resolve(addon.path, addonMain);
};

Addon.lookup = function(addon) {
  var Constructor, addonModule, modulePath, moduleDir;

  modulePath = Addon.resolvePath(addon);
  moduleDir  = path.dirname(modulePath);

  if (fs.existsSync(modulePath)) {
    addonModule = require(modulePath);

    if (typeof addonModule === 'function') {
      Constructor = addonModule;
      Constructor.prototype._root = moduleDir;
    } else {
      Constructor = Addon.extend(assign(addonModule, {
        _root: moduleDir
      }));
    }
  } else {
    Constructor = Addon.extend({
      name: '(generated ' + addon.pkg.name + ' addon)',
      _root: moduleDir
    });
  }

  return Constructor;
};

module.exports = Addon;

