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
        type: entity.options.type,
        within: entity.options.within
      });
    }
  }
});

function addRouteToRouter(name, options) {
  var type       = options.type || 'route';
  var within     = options.within || 'root';
  var plural     = inflection.pluralize(name);
  var routerPath = path.join(process.cwd(), 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var newContent = null;

  switch (type) {
  case 'route':
    newContent = oldContent.replace(
      /(map\(function\(\) {[\s\S]+)}\)/,
      "$1  this.route('" + name + "');\n})"
    );
    break;
  case 'resource':
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
