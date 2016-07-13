var Funnel = require('broccoli-funnel');
var merge = require('lodash/merge');
var mergeTrees = require('broccoli-merge-trees');
var existsSync = require('exists-sync');
var fs = require('fs');
var path = require('path');
var writeFile = require('broccoli-file-creator');

module.exports = {
  extend: function(options) {
    if (options.treeFor) {
      throw new Error('Do not provide a custom `options.treeFor` with `EngineAddon.extend(options)`.');
    }

    /**
      Returns configuration settings that will augment the application's
      configuration settings.

      By default, engines return `null`, and maintain their own separate
      configuration settings which are retrieved via `engineConfig()`.

      @public
      @method config
      @param {String} env Name of current environment (e.g. "developement")
      @param {Object} baseConfig Initial application configuration
      @return {Object} Configuration object to be merged with application configuration.
    */
    options.config = options.config || function(env, baseConfig) {
      return null;
    };

    /**
      Returns an engine's configuration settings, to be used exclusively by the
      engine.

      By default, this method simply reads the configuration settings from
      an engine's `config/environment.js`.

      @public
      @method engineConfig
      @param {String} env Name of current environment (e.g. "developement")
      @param {Object} baseConfig Initial engine configuration
      @return {Object} Configuration object that will be provided to the engine.
    */
    options.engineConfig = function(env, baseConfig) {
      var configPath = 'config';

      if (this.pkg['ember-addon'] && this.pkg['ember-addon']['engineConfigPath']) {
        configPath = this.pkg['ember-addon']['engineConfigPath'];
      }

      configPath = path.join(this.root, configPath, 'environment.js');

      if (existsSync(configPath)) {
        var configGenerator = require(configPath);

        var engineConfig = configGenerator(env, baseConfig);

        var addonsConfig = this.getAddonsConfig(env, engineConfig);

        return merge(addonsConfig, engineConfig);
      } else {
        return this.getAddonsConfig(env, {});
      }
    };

    /**
      Returns the addons' configuration.

      @private
      @method getAddonsConfig
      @param  {String} env           Environment name
      @param  {Object} engineConfig  Engine configuration
      @return {Object}               Merged configuration of all addons
     */
    options.getAddonsConfig = function(env, engineConfig) {
      this.initializeAddons();

      var initialConfig = merge({}, engineConfig);

      return this.addons.reduce(function(config, addon) {
        if (addon.config) {
          merge(config, addon.config(env, config));
        }

        return config;
      }, initialConfig);
    };

    /**
      Overrides the content provided for the `head` section to include
      the engine's configuration settings as a meta tag.

      @public
      @method contentFor
      @param type
      @param config
    */
    options.contentFor = function(type, config) {
      if (type === 'head') {
        var engineConfig = this.engineConfig(config.environment, {});

        var content = '<meta name="' + options.name + '/config/environment" ' +
                      'content="' + escape(JSON.stringify(engineConfig)) + '" />';

        return content;
      }

      return '';
    };

    /**
      Returns a given type of tree (if present), merged with the
      application tree. For each of the trees available using this
      method, you can also use a direct method called `treeFor[Type]` (eg. `treeForApp`).

      @public
      @method treeFor
      @param {String} name
      @return {Tree}
    */
    options.treeFor = function treeFor(name) {
      var tree, trees;

      this._requireBuildPackages();

      if (name === 'app') {
        trees = [];
      } else {
        trees = this.eachAddonInvoke('treeFor', [name]);

        if (name === 'addon') {
          var treesForApp = this.eachAddonInvoke('treeFor', ['app']);

          // Include a module that reads the engine's configuration from its
          // meta tag and exports its contents.
          var configTemplatePath = path.join(__dirname, '/engine-config-from-meta.js');
          var configTemplate = fs.readFileSync(configTemplatePath, { encoding: 'utf8' });
          var configContents = configTemplate.replace('{{MODULE_PREFIX}}', options.name);
          var configTree = writeFile('/config/environment.js', configContents);
          treesForApp.push(configTree);

          var appTree = mergeTrees(treesForApp, {
            overwrite: true,
            annotation: 'Engine#treeFor (' + options.name + ' - ' + name + ')'
          });

          var funneledAppTree = new Funnel(appTree, {
            destDir: 'modules/' + options.name
          });

          trees.push(funneledAppTree);
        }
      }

      if (tree = this._treeFor(name)) {
        trees.push(tree);
      }

      if (this.isDevelopingAddon() && this.hintingEnabled() && name === 'app') {
        trees.push(this.jshintAddonTree());
      }

      return mergeTrees(trees.filter(Boolean), {
        overwrite: true,
        annotation: 'Engine#treeFor (' + options.name + ' - ' + name + ')'
      });
    };

    return options;
  }
}
