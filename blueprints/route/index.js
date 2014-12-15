var SilentError = require('../../lib/errors/silent');
var fs          = require('fs-extra');
var inflection  = require('inflection');
var path        = require('path');
var EOL         = require('os').EOL;
var EmberRouterGenerator = require('ember-router-generator');

module.exports = {
  description: 'Generates a route and registers it with the router.',

  availableOptions: [
    {
      name: 'type',
      type: String,
      values: ['route', 'resource'],
      default: 'route',
      aliases:[
        {'route': 'route'},
        {'resource': 'resource'}
      ]
    },
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
      }
    };
  },

  beforeInstall: function(options) {
    var type = options.type;

    if (type && !/^(resource|route)$/.test(type)) {
      throw new SilentError('Unknown route type "' + type + '". Should be "route" or "resource".');
    }
  },

  shouldTouchRouter: function(name) {
    var isIndex = /index$/.test(name);
    var isBasic = name === 'basic';
    var isApplication = name === 'application';

    return !isBasic && !isIndex && !isApplication;
  },

  afterInstall: function(options) {
    var entity  = options.entity;

    if (this.shouldTouchRouter(entity.name) && !options.dryRun) {
      addRouteToRouter(entity.name, {
        type: options.type,
        root: options.project.root,
        path: options.path
      });
    }
  },

  beforeUninstall: function(options) {
    var type = options.type;

    if (type && !/^(resource|route)$/.test(type)) {
      throw new SilentError('Unknown route type "' + type + '". Should be "route" or "resource".');
    }
  },

  afterUninstall: function(options) {
    var entity  = options.entity;

    if (this.shouldTouchRouter(entity.name) && !options.dryRun) {
      removeRouteFromRouter(entity.name, {
        type: options.type,
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
