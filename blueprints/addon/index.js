var fs         = require('fs');
var path       = require('path');
var walkSync   = require('walk-sync');
var stringUtil = require('../../lib/utilities/string');
var assign     = require('lodash-node/modern/objects/assign');
var uniq       = require('lodash-node/underscore/arrays/uniq');
var date       = new Date();

module.exports = {
  description: 'The default blueprint for ember-cli addons.',

  generatePackageJson: function() {
    var packagePath = path.join(this._appBlueprint.path, 'files', 'package.json');
    var contents    = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));

    delete contents.private;
    contents.name = this.project.name();
    contents.description = this.description;
    contents.keywords = contents.keywords || [];

    if (contents.keywords.indexOf('ember-addon') === -1) {
      contents.keywords.push('ember-addon');
    }

    contents['ember-addon'] = contents['ember-addon'] || {};

    contents['ember-addon'].configPath = 'tests/dummy/config';

    fs.writeFileSync(path.join(this.path, 'files', 'package.json'), JSON.stringify(contents, null, 2));
  },

  generateBowerJson: function() {
    var bowerPath = path.join(this._appBlueprint.path, 'files', 'bower.json');
    var contents  = JSON.parse(fs.readFileSync(bowerPath, { encoding: 'utf8' }));

    contents.name = this.project.name();

    fs.writeFileSync(path.join(this.path, 'files', 'bower.json'), JSON.stringify(contents, null, 2));
  },

  afterInstall: function() {
    var packagePath = path.join(this.path, 'files', 'package.json');
    var bowerPath = path.join(this.path, 'files', 'bower.json');

    [packagePath, bowerPath].forEach(function(filePath) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  },

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
      emberCLIVersion: require('../../package').version,
      year: date.getFullYear()
    }
  },

  files: function() {
    if (this._files) { return this._files; }

    this._appBlueprint   = this.lookupBlueprint('app');
    var appFiles       = this._appBlueprint.files();

    this.generatePackageJson();
    this.generateBowerJson();

    var addonFiles   = walkSync(path.join(this.path, 'files'));

    return this._files = uniq(appFiles.concat(addonFiles));
  },

  mapFile: function(file, locals) {
    var result = this._super.mapFile.call(this, file, locals);
    return this.fileMapper(result);
  },

  fileMap: {
    '^app/.gitkeep': 'app/.gitkeep',
    '^app.*':        'tests/dummy/:path',
    '^config.*':     'tests/dummy/:path',
    '^public.*':     'tests/dummy/:path',

    '^addon-config/environment.js': 'config/environment.js'
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
      return path.resolve(this._appBlueprint.path, 'files', file);
    }
  }
};
