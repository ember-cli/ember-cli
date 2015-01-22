'use strict';

var fs          = require('fs');
var path        = require('path');
var deprecate   = require('../utilities/deprecate');
var assign      = require('lodash-node/modern/objects/assign');
var glob        = require('glob');
var SilentError = require('../errors/silent');
var reexport    = require('../utilities/reexport');
var escapeRegExp= require('../utilities/escape-regexp');


var p                   = require('../preprocessors');
var preprocessJs        = p.preprocessJs;
var preprocessCss       = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;

var CoreObject = require('core-object');
var concatFilesWithSourcemaps = require('broccoli-sourcemap-concat');
var debug = require('debug')('ember-cli:models:addon');

function Addon(project) {
  this.project = project;
  this.registry = p.setupRegistry(this);
  this._didRequiredBuildPackages = false;

  this.treePaths = {
    app:               'app',
    styles:            'app/styles',
    templates:         'app/templates',
    addon:             'addon',
    'addon-styles':    'addon/styles',
    'addon-templates': 'addon/templates',
    vendor:            'vendor',
    'test-support':    'test-support',
    public:            'public'
  };

  this.treeForMethods = {
    app:               'treeForApp',
    styles:            'treeForStyles',
    templates:         'treeForTemplates',
    addon:             'treeForAddon',
    vendor:            'treeForVendor',
    'test-support':    'treeForTestSupport',
    public:            'treeForPublic'
  };

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

  this.transpileModules  = this.transpileModules || require('broccoli-es6modules');

  this.mergeTrees  = this.mergeTrees || require('broccoli-merge-trees');
  this.jshintTrees = this.jshintTrees|| require('broccoli-jshint');
  this.pickFiles   = this.pickFiles  || require('../broccoli/custom-static-compiler');
  this.Funnel      = this.Funnel     || require('broccoli-funnel');
  this.walkSync    = this.walkSync   || require('walk-sync');
};

Addon.prototype.concatFiles = function(tree, options) {
  options.sourceMapConfig = this.app.options.sourcemaps;
  return concatFilesWithSourcemaps(tree, options);
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

Addon.prototype.treeFor = function treeFor(name) {
  this._requireBuildPackages();

  var tree;
  var trees = [];

  if (tree = this._treeFor(name)) {
    trees.push(tree);
  }

  if (this.isDevelopingAddon() && this.app.hinting && name === 'app') {
    trees.push(this.jshintAddonTree());
  }

  return this.mergeTrees(trees.filter(Boolean));
};

Addon.prototype._treeFor = function _treeFor(name) {
  var treePath = path.join(this.root, this.treePaths[name]);
  var treeForMethod = this.treeForMethods[name];
  var tree;

  if (fs.existsSync(treePath)) {
    tree = this.treeGenerator(treePath);
  }

  if (this[treeForMethod]) {
    tree = this[treeForMethod](tree);
  }

  return tree;
};

Addon.prototype.included = function(/* app */) {
};

Addon.prototype.includedModules = function() {
  if (this._includedModules) {
    return this._includedModules;
  }

  var _this    = this;
  var treePath = path.join(this.root, this.treePaths['addon']).replace(/\\/g, '/');
  var modulePath;

  var globPattern = '**/*.+(' + this.registry.extensionsForType('js').join('|') + ')';

  this._includedModules = glob.sync(path.join(treePath, globPattern)).reduce(function(ignoredModules, filePath) {
    modulePath = filePath.replace(treePath, _this.moduleName());
    modulePath = modulePath.slice(0, -(path.extname(modulePath).length));

    ignoredModules[modulePath] = ['default'];
    return ignoredModules;
  }, {});

  if (this._includedModules[this.moduleName() + '/index']) {
    this._includedModules[this.moduleName()] = ['default'];
  }

  return this._includedModules;
};

Addon.prototype.treeForPublic = function(tree) {
  this._requireBuildPackages();

  if (!tree) {
    return tree;
  }

  return this.pickFiles(tree, {
    srcDir: '/',
    destDir: '/' + this.moduleName()
  });
};

Addon.prototype.treeForAddon = function(tree) {
  this._requireBuildPackages();

  if (!tree) {
    return tree;
  }

  var addonTree = this.compileAddon(tree);
  var stylesTree = this.compileStyles(this._treeFor('addon-styles'));
  var jsTree;

  if (addonTree) {
    jsTree = this.concatFiles(addonTree, {
      inputFiles: ['**/*.js'],
      outputFile: '/' + this.name + '.js',
      allowNone: true
    });
  }

  return this.mergeTrees([jsTree, stylesTree].filter(Boolean));
};

Addon.prototype.compileStyles = function(tree) {
  this._requireBuildPackages();

  if (tree) {
    var self = this;
    var processedStyles = preprocessCss(tree, '/', '/', {
      registry: this.registry
    });

    return new this.Funnel(processedStyles, {
      getDestinationPath: function(relativePath) {
        if (relativePath === 'app.css') {
          return self.name + '.css';
        }

        return relativePath;
      },
      description: 'Funnel: Addon CSS'
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

    var includePatterns = this.registry.extensionsForType('template').map(function(extension) {
      return new RegExp('template.' + extension + '$');
    });

    var podTemplates = new this.Funnel(tree, {
      include: includePatterns,
      destDir: this.name + '/',
      description: 'Funnel: Addon Pod Templates'
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
  var templatesTree = this.compileTemplates(this._treeFor('addon-templates'));
  var reexported = reexport(this.name, '__reexport.js');
  var trees = [addonJs, templatesTree].filter(Boolean);

  var es6Tree = new this.transpileModules(
    new this.Funnel(this.mergeTrees(trees), {
      include: [new RegExp(escapeRegExp(this.name+'/') + '.*\\.js$')],
      description: 'Funnel: Addon Tree'
    })
  );

  es6Tree = this.mergeTrees([es6Tree, reexported]);

  es6Tree = this.concatFiles(es6Tree, {
    inputFiles: [this.name + '/**/*.js'],
    outputFile: '/' + this.name + '.js',
    footerFiles: ['__reexport.js']
  });

  return es6Tree;
};

Addon.prototype.jshintAddonTree = function() {
  this._requireBuildPackages();

  var addonPath = path.join(this.root, this.treePaths['addon']);

  debug('jshint: %s exists', addonPath);

  if (!fs.existsSync(addonPath)) {
    debug('jshint: %s does not exist', addonPath);
    return;
  }

  debug('jshint: %s exists', addonPath);

  var addonJs = this.addonJsFiles(addonPath);
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

  var includePatterns = this.registry.extensionsForType('js').map(function(extension) {
    return new RegExp(extension + '$');
  });

  var files = new this.Funnel(tree, {
    include: includePatterns,
    destDir: this.moduleName(),
    description: 'Funnel: Addon JS'
  });

  return preprocessJs(files, '/', this.name, {
    registry: this.registry
  });
};

Addon.prototype.moduleName = function() {
  if (!this.modulePrefix) {
    this.modulePrefix = (this.modulePrefix || this.name).toLowerCase().replace(/\s/g, '-');
  }

  return this.modulePrefix;
};

Addon.prototype.blueprintsPath = function() {
  var blueprintPath = path.join(this.root, 'blueprints');

  if (fs.existsSync(blueprintPath)) {
    return blueprintPath;
  }
};

Addon.prototype.config = function (env, baseConfig) {
  var configPath = path.join(this.root, 'config', 'environment.js');

  if (fs.existsSync(configPath)) {
    var configGenerator = require(configPath);

    return configGenerator(env, baseConfig);
  }
};

Addon.prototype.isEnabled = function() {
  return true;
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
      Constructor.prototype.pkg  = Constructor.prototype.pkg || addon.pkg;
    } else {
      Constructor = Addon.extend(assign({
        root: moduleDir,
        pkg: addon.pkg
      }, addonModule));
    }
  } else {
    Constructor = Addon.extend({
      name: '(generated ' + addon.pkg.name + ' addon)',
      root: moduleDir,
      pkg: addon.pkg
    });
  }

  return Constructor;
};

module.exports = Addon;
