var fs         = require('fs');
var path       = require('path');
var walkSync   = require('walk-sync');
var Blueprint  = require('../../lib/models/blueprint');
var stringUtil = require('../../lib/utilities/string');
var assign     = require('lodash-node/modern/objects/assign');
var uniq       = require('lodash-node/underscore/arrays/uniq');

module.exports = Blueprint.extend({
  locals: function(options) {
    var entity    = { name: 'dummy' };
    var rawName   = entity.name;
    var name      = stringUtil.dasherize(rawName);
    var namespace = stringUtil.classify(rawName);

    var addonEntity    = options.entity;
    var addonRawName   = addonEntity.name;
    var addonName      = stringUtil.dasherize(addonRawName);
    var addonNamespace = stringUtil.classify(addonRawName);

    return {
      name: name,
      modulePrefix: name,
      namespace: namespace,
      addonName: addonName,
      addonModulePrefix: addonName,
      addonNamespace: addonNamespace,
      emberCLIVersion: require('../../package').version
    }
  },
  files: function() {
    if (this._files) { return this._files; }
    var appFiles   = Blueprint.lookup('app').files();
    var addonFiles = walkSync(path.join(this.path, 'files'));
    return this._files = uniq(appFiles.concat(addonFiles));
  },
  mapFile: function(file, locals) {
    var result = Blueprint.prototype.mapFile.call(this, file, locals);
    return this.fileMapper(result);
  },
  fileMap: {
    '^.jshintrc':   'tests/dummy/:path',
    '^app/.gitkeep': 'app/.gitkeep',
    '^app.*':        'tests/dummy/:path',
    '^config.*':     'tests/dummy/:path',
    '^public.*':     'tests/dummy/:path'
  },
  fileMapper: function(path) {
    for(pattern in this.fileMap) {
      if ((new RegExp(pattern)).test(path)) {
        return this.fileMap[pattern].replace(':path', path);
      }
    }

    return path;
  },
  srcPath: function(file) {
    var filePath = path.resolve(this.path, 'files', file);
    if (fs.existsSync(filePath)) {
      return filePath;
    } else {
      var appBlueprint = Blueprint.lookup('app');
      return path.resolve(appBlueprint.path, 'files', file);
    }
  }
});
