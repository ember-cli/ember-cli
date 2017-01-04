var fs = require('fs-extra');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');
var Blueprint = require('../../lib/models/blueprint');
var stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');

module.exports = {
  description: 'The blueprint for addon in repo ember-cli addons.',

  beforeInstall(options) {
    var libBlueprint = Blueprint.lookup('lib', {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    });

    return libBlueprint.install(options);
  },

  afterInstall(options) {
    this._generatePackageJson(options, true);
  },

  afterUninstall(options) {
    this._generatePackageJson(options, false);
  },

  _generatePackageJson(options, isInstall) {
    var packagePath = path.join(this.project.root, 'package.json');
    var contents = fs.readJsonSync(packagePath);
    var name = stringUtil.dasherize(options.entity.name);
    var newPath = ['lib', name].join('/');
    var paths;

    contents['ember-addon'] = contents['ember-addon'] || {};
    paths = contents['ember-addon']['paths'] = contents['ember-addon']['paths'] || [];

    if (isInstall) {
      if (paths.indexOf(newPath) === -1) {
        paths.push(newPath);
        contents['ember-addon']['paths'] = paths.sort();
      }
    } else {
      var newPathIndex = paths.indexOf(newPath);
      if (newPathIndex > -1) {
        paths.splice(newPathIndex, 1);
        if (paths.length === 0) {
          delete contents['ember-addon']['paths'];
        }
      }
    }

    fs.writeFileSync(packagePath, stringifyAndNormalize(contents));
  },
};
