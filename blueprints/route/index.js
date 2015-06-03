/*jshint node:true*/

var SilentError = require('../../lib/errors/silent');
var fs          = require('fs-extra');
var path        = require('path');
var EmberRouterGenerator = require('ember-router-generator');

module.exports = {
  description: 'Generates a route and registers it with the router.',

  availableOptions: [
    {
      name: 'path',
      type: String,
      default: ''
    }
  ],

  fileMapTokens: function() {
    return {
      __templatepath__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, options.dasherizedModuleName);
        }
        return 'templates';
      },
      __templatename__: function(options) {
        if (options.pod) {
          return 'template';
        }
        return options.dasherizedModuleName;
      },
      __root__: function(options) {
        if (options.inRepoAddon) {
          return path.join('lib', options.inRepoAddon, 'addon');
        }

        if (options.inAddon) {
          return 'addon';
        }

        return 'app';
      }
    };
  },

  shouldTouchRouter: function(name) {
    var isIndex = name === 'index';
    var isBasic = name === 'basic';
    var isApplication = name === 'application';

    return !isBasic && !isIndex && !isApplication;
  },

  afterInstall: function(options) {
    var entity  = options.entity;

    if (this.shouldTouchRouter(entity.name) && !options.dryRun && !options.project.isEmberCLIAddon() && !options.inRepoAddon) {
      addRouteToRouter(entity.name, {
        root: options.project.root,
        path: options.path
      });
    }
  },

  afterUninstall: function(options) {
    var entity  = options.entity;

    if (this.shouldTouchRouter(entity.name) && !options.dryRun && !options.project.isEmberCLIAddon() && !options.inRepoAddon) {
      removeRouteFromRouter(entity.name, {
        root: options.project.root
      });
    }
  }
};

function removeRouteFromRouter(name, options) {
  var routerPath = path.join(options.root, 'app', 'router.js');
  var source = fs.readFileSync(routerPath, 'utf-8');

  var routes = new EmberRouterGenerator(source);
  var newRoutes = routes.remove(name);

  fs.writeFileSync(routerPath, newRoutes.code());
}

function addRouteToRouter(name, options) {
  var routerPath = path.join(options.root, 'app', 'router.js');
  var source = fs.readFileSync(routerPath, 'utf-8');

  var routes = new EmberRouterGenerator(source);
  var newRoutes = routes.add(name, options);

  fs.writeFileSync(routerPath, newRoutes.code());
}
