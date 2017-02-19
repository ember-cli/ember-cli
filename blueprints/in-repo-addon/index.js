'use strict';

const fs = require('fs-extra');
const path = require('path');
const stringUtil = require('ember-cli-string-utils');
const Blueprint = require('../../lib/models/blueprint');
const stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');

module.exports = {
  description: 'The blueprint for addon in repo ember-cli addons.',

  beforeInstall(options) {
    let libBlueprint = Blueprint.lookup('lib', {
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
    let packagePath = path.join(this.project.root, 'package.json');
    let contents = this._readJsonSync(packagePath);
    let name = stringUtil.dasherize(options.entity.name);
    let newPath = ['lib', name].join('/');
    let paths;

    contents['ember-addon'] = contents['ember-addon'] || {};
    paths = contents['ember-addon']['paths'] = contents['ember-addon']['paths'] || [];

    if (isInstall) {
      if (paths.indexOf(newPath) === -1) {
        paths.push(newPath);
        contents['ember-addon']['paths'] = paths.sort();
      }
    } else {
      let newPathIndex = paths.indexOf(newPath);
      if (newPathIndex > -1) {
        paths.splice(newPathIndex, 1);
        if (paths.length === 0) {
          delete contents['ember-addon']['paths'];
        }
      }
    }

    this._writeFileSync(packagePath, stringifyAndNormalize(contents));
  },

  _readJsonSync(path) {
    return fs.readJsonSync(path);
  },

  _writeFileSync(path, content) {
    fs.writeFileSync(path, content);
  },
};
