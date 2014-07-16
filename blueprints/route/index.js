var Blueprint  = require('../../lib/models/blueprint');
var fs         = require('fs-extra');
var inflection = require('inflection');
var path       = require('path');

module.exports = Blueprint.extend({
  afterInstall: function(options) {
    var entity = options.entity;
    var isIndex = /index$/.test(entity.name);

    if (!isIndex) {
      addRouteToRouter(entity.name, {
        type: entity.options.type
      });
    }
  }
});

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
      "$1  this.route('" + name + "');\n})"
    );
    break;
  case 'resource':
    plural = inflection.pluralize(name);

    if (plural === name) {
      newContent = oldContent.replace(
        /(map\(function\(\) {[\s\S]+)}\)/,
        "$1  this.resource('" + name + "');\n})"
      );
    } else {
      newContent = oldContent.replace(
        /(map\(function\(\) {[\s\S]+)}\)/,
        "$1  this.resource('" + name + "', { path: '" + plural + "/:" + name + "_id' });\n})"
      );
    }
    break;
  }

  fs.writeFileSync(routerPath, newContent);
}
