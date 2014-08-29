var Blueprint   = require('../../lib/models/blueprint');
var SilentError = require('../../lib/errors/silent');
var fs          = require('fs-extra');
var inflection  = require('inflection');
var path        = require('path');
var EOL         = require('os').EOL;

module.exports = Blueprint.extend({
  beforeInstall: function(options) {
    var type = options.type;

    if (type && !/^(resource|route)$/.test(type)) {
      throw new SilentError('Unknown route type "' + type + '". Should be "route" or "resource".');
    }
  },

  afterInstall: function(options) {
    var entity  = options.entity;
    var isIndex = /index$/.test(entity.name);

    if (!isIndex && !options.dryRun) {
      addRouteToRouter(entity.name, {
        type: options.type
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
    var isIndex = /index$/.test(entity.name);

    if (!isIndex && !options.dryRun) {
      removeRouteFromRouter(entity.name, {
        type: options.type
      });
    }
  }
});

function removeRouteFromRouter(name, options) {
  var type       = options.type || 'route';
  var routerPath = path.join(process.cwd(), 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (!existence.test(oldContent)) {
    return;
  }

  if (name === 'basic') { return; }

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
  var routerPath = path.join(process.cwd(), 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (existence.test(oldContent)) {
    return;
  }

  if (name === 'basic') { return; }

  switch (type) {
  case 'route':
    newContent = oldContent.replace(
      /(map\(function\(\) {[\s\S]+)}\)/,
      "$1  this.route('" + name + "');" + EOL + "})"
    );
    break;
  case 'resource':
    plural = inflection.pluralize(name);

    if (plural === name) {
      newContent = oldContent.replace(
        /(map\(function\(\) {[\s\S]+)}\)/,
        "$1  this.resource('" + name + "', function() { });" + EOL + "})"
      );
    } else {
      newContent = oldContent.replace(
        /(map\(function\(\) {[\s\S]+)}\)/,
        "$1  this.resource('" + name + "', { path: '" + plural + "/:" + name + "_id' });" + EOL + "})"
      );
    }
    break;
  }

  fs.writeFileSync(routerPath, newContent);
}
