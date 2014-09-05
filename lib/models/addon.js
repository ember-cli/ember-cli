'use strict';

var fs          = require('fs');
var path        = require('path');
var deprecate   = require('../utilities/deprecate');
var assign      = require('lodash-node/modern/objects/assign');
var glob        = require('glob');
var SilentError = require('../errors/silent');

var p                   = require('../preprocessors');
var preprocessJs        = p.preprocessJs;
var preprocessCss       = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;

var CoreObject = require('core-object');

function Addon(project) {
  this.project = project;
  this.registry = p.setupRegistry(this);
  this._didRequiredBuildPackages = false;

  if (!this.name) {
    throw new SilentError('An addon must define a `name` property.');
  }
}

Addon.__proto__ = CoreObject;
Addon.prototype.constructor = Addon;

Addon.prototype._requireBuildPackages = function() {
  if (this._didRequiredBuildPackages === true) {
    return;
  } else {
    this._didRequiredBuildPackages = true;
  }

  this.compileES6  = this.compileES6 || require('broccoli-es6-concatenator');
  this.mergeTrees  = this.mergeTrees || require('broccoli-merge-trees');
  this.jshintTrees = this.jshintTrees|| require('broccoli-jshint');
  this.concatFiles = this.concatFiles|| require('broccoli-concat');
  this.fileMover   = this.fileMover  || require('broccoli-file-mover');
  this.pickFiles   = this.pickFiles  || require('../broccoli/custom-static-compiler');
};

Addon.prototype._unwatchedTreeGenerator = function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
};

Addon.prototype.isDevelopingAddon = function() {
  return process.env.EMBER_ADDON_ENV === 'development';
};

Addon.prototype.treeGenerator = function(dir) {
  var tree;
  if (this.isDevelopingAddon()) {
    tree = dir;
  } else {
    tree = this._unwatchedTreeGenerator(dir);
  }

  return tree;
};

Addon.prototype.treePaths = {
  app:               'app',
  styles:            'app/styles',
  templates:         'app/templates',
  addon:             'addon',
  'addon-styles':    'addon/styles',
  'addon-templates': 'addon/templates',
  vendor:            'vendor',
  'test-support':    'test-support'
};

Addon.prototype.treeFor = function treeFor(name) {
  this._requireBuildPackages();

  var tree;
  var trees = [];

  if (tree = this._treeFor(name)) {
    trees.push(tree);
  }

  if (this.isDevelopingAddon() && this.app.hinting && name === 'app') {
    trees.push(this.jshinting());
  }

  return this.mergeTrees(trees);
};

Addon.prototype._treeFor = function _treeFor(name) {
  var treePath = path.join(this.root, this.treePaths[name]);
  var tree;

  if (fs.existsSync(treePath)) {
    tree = this.treeGenerator(treePath);

    if (name === 'addon') {
      tree = this.treeForAddon(tree);
    }
  }

  return tree;
};

Addon.prototype.included = function(app) {
  this.app = app;
};

Addon.prototype.includedModules = function() {
  if (this._includedModules) {
    return this._includedModules;
  }

  var moduleName = this.moduleName();
  var treePath   = path.join(this.root, this.treePaths['addon']);

  this._includedModules = glob.sync(path.join(treePath, '**/*.js')).reduce(function(ignoredModules, filePath) {
    ignoredModules[filePath.replace(treePath, moduleName).slice(0, -3)] = ['default'];
    return ignoredModules;
  }, {});

  return this._includedModules;
};

Addon.prototype.treeForAddon = function(tree) {
  this._requireBuildPackages();

  var addonTree = this.compileAddon(tree);
  var stylesTree = this.compileStyles(this._treeFor('addon-styles'));
  var templatesTree = this.compileTemplates(this._treeFor('addon-templates'));

  var jsTree = this.concatFiles(this.mergeTrees([addonTree, templatesTree].filter(Boolean)), {
    inputFiles: ['*.js', '**/*.js'],
    outputFile: '/' + this.name + '.js',
    allowNone: true
  });

  return this.mergeTrees([jsTree, stylesTree].filter(Boolean));
};

Addon.prototype.compileStyles = function(tree) {
  this._requireBuildPackages();

  if (tree) {
    var styleFiles = this.pickFiles(tree, {
      srcDir: '/styles',
      destDir: '/'
    });
    var processedStyles = preprocessCss(styleFiles, '/', '/', {
      registry: this.registry
    });
    return this.fileMover(processedStyles, {
      srcFile: '/' + this.app.name + '.css',
      destFile: '/' + this.name + '.css'
    });
  }
};

Addon.prototype.compileTemplates = function(tree) {
  this._requireBuildPackages();

  if (tree) {
    var standardTemplates = this.pickFiles(tree, {
      srcDir: '/',
      destDir: this.name + '/templates'
    });

    var podTemplates = this.pickFiles(tree, {
      srcDir: '/',
      files: ['**/template.*'],
      destDir: this.name + '/',
      allowEmpty: true
    });

    return preprocessTemplates(this.mergeTrees([standardTemplates, podTemplates]), {
      registry: this.registry
    });
  }
};

Addon.prototype.compileAddon = function(tree) {
  this._requireBuildPackages();

  if (Object.keys(this.includedModules()).length === 0) {
    return;
  }

  var addonJs = this.addonJsFiles(tree);

  var es6Tree = this.compileES6(addonJs, {
    ignoredModules: Object.keys(this.app.importWhitelist),
    inputFiles: [this.name + '/**/*.js'],
    wrapInEval: this.app.options.wrapInEval,
    outputFile: '/' + this.name + '.js'
  });

  this.app.importWhitelist = assign(this.app.importWhitelist, this.includedModules());

  return es6Tree;
};

Addon.prototype.jshinting = function() {
  this._requireBuildPackages();

  var addonJs = this.addonJsFiles('addon');
  var jshintedAddon = this.jshintTrees(addonJs, {
    jshintrcPath: this.app.options.jshintrc.app,
    description: 'JSHint - Addon'
  });
  return this.pickFiles(jshintedAddon, {
    srcDir: '/',
    destDir: this.name + '/tests/'
  });
};

Addon.prototype.addonJsFiles = function(tree) {
  this._requireBuildPackages();

  var files = this.pickFiles(tree, {
    srcDir: '/',
    files: ['**/*.js'],
    destDir: this.name,
    allowEmpty: true
  });

  return preprocessJs(files, '/', this.name, {
    registry: this.registry
  });
};

Addon.prototype.moduleName = function() {
  return this.name.toLowerCase().replace(/\s/g, '-');
};

Addon.prototype.blueprintsPath = function() {
  var blueprintPath = path.join(this.root, 'blueprints');

  if (fs.existsSync(blueprintPath)) {
    return blueprintPath;
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
      Constructor.prototype.root = Constructor.prototype.root || moduleDir;
    } else {
      Constructor = Addon.extend(assign({root: moduleDir}, addonModule));
    }
  } else {
    Constructor = Addon.extend({
      name: '(generated ' + addon.pkg.name + ' addon)',
      root: moduleDir
    });
  }

  return Constructor;
};

module.exports = Addon;

