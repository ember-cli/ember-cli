'use strict';

/**
@module ember-cli
*/

var fs           = require('fs');
var path         = require('path');
var deprecate    = require('../utilities/deprecate');
var assign       = require('lodash-node/modern/objects/assign');
var glob         = require('glob');
var SilentError  = require('../errors/silent');
var reexport     = require('../utilities/reexport');
var escapeRegExp = require('../utilities/escape-regexp');

var p                   = require('../preprocessors');
var preprocessJs        = p.preprocessJs;
var preprocessCss       = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;

var CoreObject = require('core-object');

/**
  Root class for an Addon. If your addon module exports an Object this
  will be extended from this base class. If you export a constructor (function),
  it will **not** extend from this class.

  Hooks:

  - {{#crossLink "Addon/config:method"}}config{{/crossLink}}
  - {{#crossLink "Addon/blueprintsPath:method"}}blueprintsPath{{/crossLink}}
  - {{#crossLink "Addon/includedCommands:method"}}includedCommands{{/crossLink}}
  - {{#crossLink "Addon/serverMiddleware:method"}}serverMiddleware{{/crossLink}}
  - {{#crossLink "Addon/postBuild:method"}}postBuild{{/crossLink}}
  - {{#crossLink "Addon/preBuild:method"}}preBuild{{/crossLink}}
  - {{#crossLink "Addon/buildError:method"}}buildError{{/crossLink}}
  - {{#crossLink "Addon/included:method"}}included{{/crossLink}}
  - {{#crossLink "Addon/postprocessTree:method"}}postprocessTree{{/crossLink}}
  - {{#crossLink "Addon/treeFor:method"}}treeFor{{/crossLink}}

  @class Addon
  @extends CoreObject
  @constructor
  @param {Project} project The current project
*/
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

/**
  Loads all required modules for a build

  @private
  @method _requireBuildPackages
 */
Addon.prototype._requireBuildPackages = function() {
  if (this._didRequiredBuildPackages === true) {
    return;
  } else {
    this._didRequiredBuildPackages = true;
  }

  this.transpileModules  = this.transpileModules || require('broccoli-es6modules');

  this.mergeTrees  = this.mergeTrees || require('broccoli-merge-trees');
  this.pickFiles   = this.pickFiles  || require('../broccoli/custom-static-compiler');
  this.Funnel      = this.Funnel     || require('broccoli-funnel');
  this.walkSync    = this.walkSync   || require('walk-sync');
};

/**
  Shorthand method for [broccoli-sourcemap-concat](https://github.com/ef4/broccoli-sourcemap-concat)

  @private
  @method concatFiles
  @param {tree} tree Tree of files
  @param {Object} options Options for broccoli-sourcemap-concat
  @return {tree} Modified tree
*/
Addon.prototype.concatFiles = function(tree, options) {
  options.sourceMapConfig = this.app.options.sourcemaps;
  return require('broccoli-sourcemap-concat')(tree, options);
};

/**  
  Generate an unwatched tree.

  @private
  @method _unwatchedTreeGenerator
  @param {Tree} dir Tree
  @return {Tree} Unwatched tree
*/
Addon.prototype._unwatchedTreeGenerator = function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
};

/**
  Returns whether or not this addon is running in development

  @private
  @method isDevelopingAddon
  @return {Boolean}
*/
Addon.prototype.isDevelopingAddon = function() {
  return process.env.EMBER_ADDON_ENV === 'development';
};

/**
  Generates a tree for the specified path

  @private
  @method treeGenerator
  @return {tree}
*/
Addon.prototype.treeGenerator = function(dir) {
  var tree;
  if (this.isDevelopingAddon()) {
    tree = dir;
  } else {
    tree = this._unwatchedTreeGenerator(dir);
  }

  return tree;
};

/**
  Returns a given type of tree (if present), merged with the 
  application tree. For each of the trees available using this
  method, you can also use a direct method called treeFor[Type] (eg. `treeForApp`).

  Available tree names:
  - app
  - styles
  - templates
  - {{#crossLink "Addon/treeForAddon:method"}}addon{{/crossLink}}
  - vendor
  - test-support
  - {{#crossLink "Addon/treeForPublic:method"}}public{{/crossLink}}  

  @public
  @method treeFor
  @param {String} name
  @return {tree}
*/
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

/**
  @private 
  @param {String} name
  @method _treeFor
  @return {tree}
*/
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

/**
  This method is called when the addon is included in a build. You
  would typically use this hook to perform additional imports

  ```js
    included: function(app) {
      app.import(somePath);
    }
  ```

  @public
  @method included
  @param {EmberApp} app The application object
*/
Addon.prototype.included = function(/* app */) {
};


/**
  Returns a list of all javascript files included with this addon

  @public
  @method includedModules
  @return {Object} Paths and exported objects as key-value pairs
*/
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

/**
  Returns the tree for all public files

  @public
  @method treeForPublic
  @param {Tree} tree
  @return {Tree} Public file tree
*/
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

/**
  Returns a tree for this addon

  @public
  @method treeForAddon
  @param {Tree} tree
  @return {Tree} Addon file tree
*/
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

/**
  Runs the styles tree through preprocessors.

  @private
  @method compileStyles
  @param {Tree} tree Styles file tree
  @return {Tree} Compiled styles tree
*/
Addon.prototype.compileStyles = function(tree) {
  this._requireBuildPackages();

  if (tree) {
    return preprocessCss(tree, '/', '/', {
      outputPaths: { 'addon': this.name + '.css' },
      registry: this.registry
    });
  }
};

/**
  Runs the templates tree through preprocessors.

  @private
  @method compileTemplates
  @param {Tree} tree Templates file tree
  @return {Tree} Compiled templates tree
*/
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

/**
  Runs the addon tree through preprocessors.

  @private
  @method compileAddon
  @param {Tree} tree Addon file tree
  @return {Tree} Compiled addon tree
*/
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

/**
  Returns a tree with JSHhint output for all addon JS.

  @private
  @method jshintAddonTree
  @return {Tree} Tree with JShint output (tests)
*/
Addon.prototype.jshintAddonTree = function() {
  this._requireBuildPackages();

  var addonPath = path.join(this.root, this.treePaths['addon']);

  if (!fs.existsSync(addonPath)) {
    return;
  }

  var addonJs = this.addonJsFiles(addonPath);
  var jshintedAddon = this.app.addonLintTree('addon', addonJs);

  return this.pickFiles(jshintedAddon, {
    srcDir: '/',
    destDir: this.name + '/tests/'
  });
};

/**
  Returns a tree with all javascript for this addon.

  @private
  @method addonJsFiles
  @return {Tree} Javascript file tree
*/
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

/**
  Returns the module name for this addon.

  @public
  @method moduleName
  @return {String} module name
*/
Addon.prototype.moduleName = function() {
  if (!this.modulePrefix) {
    this.modulePrefix = (this.modulePrefix || this.name).toLowerCase().replace(/\s/g, '-');
  }

  return this.modulePrefix;
};

/**
  Returns the path for addon blueprints.

  @private
  @method blueprintsPath
  @return {String} The path for blueprints
*/
Addon.prototype.blueprintsPath = function() {
  var blueprintPath = path.join(this.root, 'blueprints');

  if (fs.existsSync(blueprintPath)) {
    return blueprintPath;
  }
};

/**
  Augments the applications configuration settings. 
  Object returned from this hook is merged with the application's configuration object. 
  Application's configuration always take precedence.


  ```js
    config: function(environment, appConfig) {
      return {
        someAddonDefault: "foo"
      };
    }
  ```

  @public
  @method config
  @param {String} env Name of current environment (ie "developement")
  @param {Object} baseConfig Initial application configuration
  @return {Object} Configuration object to be merged with application configuration.
*/
Addon.prototype.config = function (env, baseConfig) {
  var configPath = path.join(this.root, 'config', 'environment.js');

  if (fs.existsSync(configPath)) {
    var configGenerator = require(configPath);

    return configGenerator(env, baseConfig);
  }
};

/**
  @public
  @method dependencies
  @return {Object} The addon's dependencies based on the addon's package.json
*/
Addon.prototype.dependencies = function() {
  var pkg = this.pkg || {};
  return assign({}, pkg['devDependencies'], pkg['dependencies']);
};

/**
  @public
  @method isEnabled
  @return {Boolean} Whether or not this addon is enabled
*/
Addon.prototype.isEnabled = function() {
  return true;
};

/**
  Returns the absolute path for a given addon

  @private
  @method resolvePath
  @param {String} addon Addon name
  @return {String} Absolute addon path
*/
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

/**
  Returns the addon class for a given addon name.
  If the Addon exports a function, that function is used
  as constructor. If an Object is exported, a subclass of
  `Addon` is returned with the exported hash merged into it.

  @private
  @static
  @method lookup
  @param {String} addon Addon name
  @return {Addon} Addon class
*/
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


// Methods without default implementation

/**
  CLI commands included with this addon. This function should return
  an object with command names and command instances/create options.

  This function is not implemented by default

  ```js
    includedCommands: function() {
      return {
        'do-foo': require('./lib/commands/foo')
      };
    }
  ```
  
  @public
  @method includedCommands
  @return {Object} An object with included commands
*/


/**
  Post-process a tree
  
  @public
  @method postProcessTree
  @param {String} type What kind of tree (eg. 'javascript', 'styles')
  @param {Tree} Tree to process
  @return {Tree} Processed tree
*/

/**
  This hook allows you to make changes to the express server run by ember-cli.
  It's passed an `startOptions` object which contains:
  - `app` Express server instance
  - `options` A hash with:
    - `project` Current {{#crossLink "Project"}}project{{/crossLink}}
    - `watcher`
    - `environment`

  This function is not implemented by default

  ```js
    serverMiddleware: function(startOptions) {
      var app = startOptions.app;

      app.use(function(req, res, next) {
        // Some middleware
      });
    }
  ```
  
  @public
  @method serverMiddleware
  @param {Object} startOptions Express server start options
*/

/**
  This hook is called before a build takes place.
  
  @public
  @method preBuild
  @param {Object} result Build object
*/

/**
  This hook is called after a build is complete.

  It's passed an `result` object which contains:
  - `directory` Path to build output
  
  @public
  @method postBuild
  @param {Object} result Build result object
*/

/**
  This hook is called when an error occurs during the preBuild or postBuild hooks 
  for addons, or when the build fails

  @public
  @method buildError
  @param {Error} error The error that was caught during the processes listed above
*/
module.exports = Addon;
