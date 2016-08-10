var fs   = require('fs-extra');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');
var Blueprint = require('../../lib/models/blueprint');

module.exports = {
  description: 'The blueprint for addon in repo ember-cli addons.',

  beforeInstall: function(options) {
    var libBlueprint = Blueprint.lookup('lib', {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return libBlueprint.install(options);
  },

  afterInstall: function(options) {
    var packagePath = path.join(this.project.root, 'package.json');
    var contents    = fs.readJsonSync(packagePath);
    var name        = stringUtil.dasherize(options.entity.name);
    var newPath     = ['lib', name].join('/');
    var paths;

    contents['ember-addon'] = contents['ember-addon'] || {};
    paths = contents['ember-addon']['paths'] = contents['ember-addon']['paths'] || [];

    if (paths.indexOf(newPath) === -1) {
      paths.push(newPath);
    }

    fs.writeFileSync(packagePath, JSON.stringify(contents, null, 2));
  },

  afterUninstall: function(options) {
    var packagePath   = path.join(this.project.root, 'package.json');
    var contents      = fs.readJsonSync(packagePath);
    var name          = stringUtil.dasherize(options.entity.name);
    var newPath       = ['lib', name].join('/');
    var libBlueprint  = Blueprint.lookup('lib', {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });
    var paths;
    var newPathIndex;
    var lib;

    contents['ember-addon'] = contents['ember-addon'] || {};
    paths = contents['ember-addon']['paths'] = contents['ember-addon']['paths'] || [];
    newPathIndex = paths.indexOf(newPath);

    if (newPathIndex > -1) {
      paths.splice(newPathIndex, 1);
      if (paths.length === 0) {
        delete contents['ember-addon']['paths'];
      }
    }

    fs.writeFileSync(packagePath, JSON.stringify(contents, null, 2) + '\n');

    if (!fs.readdirSync(newPath).length) {
      fs.removeSync(newPath);
    }

    lib = fs.readdirSync('lib');
    if (lib.length === 0 || (lib.length === 1 && lib[0] === '.jshintrc')) {
      return libBlueprint.uninstall(options);
    }
  }
};
