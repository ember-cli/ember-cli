var SilentError = require('../../lib/errors/silent');
var fs          = require('fs-extra');
var inflection  = require('inflection');
var path        = require('path');
var EOL         = require('os').EOL;

module.exports = {
  description: 'Generates a route and registers it with the router.',

  availableOptions: [
    { name: 'type', type: String, values: ['route', 'resource'], default: 'route', aliases:[{'route': 'route'}, {'resource': 'resource'}] }
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
        root: options.project.root
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
  var type       = options.type || 'route';
  var routerPath = path.join(options.root, 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (!existence.test(oldContent)) {
    return;
  }

  switch (type) {
  case 'route':
    var re = new RegExp('\\s*this.route\\((["\'])'+ name +'(["\'])\\);');
    newContent = oldContent.replace(re, '');
    break;
  case 'resource':
    plural = inflection.pluralize(name);

    if (plural === name) {
      var re = new RegExp('\\s*this.resource\\((["\'])'+ name +'(["\'])\\);');
      newContent = oldContent.replace(re, '');
    } else {
      var re = new RegExp('\\s*this.resource\\((["\'])'+ name +'(["\']),.*\\);');
      newContent = oldContent.replace(re, '');
    }
    break;
  }

  fs.writeFileSync(routerPath, newContent);
}

function addRouteToRouter(name, options) {
  var type       = options.type || 'route';
  var routerPath = path.join(options.root, 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (existence.test(oldContent)) {
    return;
  }

  switch (type) {
  case 'route':
    newContent = oldContent.replace(
      /map\(function\(\)(\s+|){(.|)(([\s\S]+?))(\s|)/,
      "map(function() {" + EOL + "  this.route('" + name + "');" + EOL + "$1"
    );
    break;
  case 'resource':
    plural = inflection.pluralize(name);

    if (plural === name) {
      newContent = oldContent.replace(
        /map\(function\(\)(\s+|){(.|)(([\s\S]+?))(\s|)/,
        "map(function() {" + EOL + "  this.resource('" + name + "', function() { });" + EOL + "$1"
      );
    } else {
      newContent = oldContent.replace(
        /map\(function\(\)(\s+|){(.|)(([\s\S]+?))(\s|)/,
        "map(function() {" + EOL + "  this.resource('" + name + "', { path: '" + plural + "/:" + name + "_id' }, function() { });" + EOL + "$1"
      );
    }
    break;
  }

  fs.writeFileSync(routerPath, newContent);
}
