'use strict';

const stringUtil = require('ember-cli-string-utils');
const Blueprint = require('../../lib/models/blueprint');
const adjustPackageJson = require('./adjust-pkg');

module.exports = {
  description: 'The default blueprint for ember-cli projects.',

  filesToRemove: [
    'app/styles/.gitkeep',
    'app/templates/.gitkeep',
    'app/views/.gitkeep',
    'public/.gitkeep',
    'Brocfile.js',
    'testem.json',
  ],

  locals(options) {
    let entity = options.entity;
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);
    let namespace = stringUtil.classify(rawName);

    return {
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require('../../package').version,
      yarn: options.yarn,
      welcome: options.welcome,
      blueprint: 'app',
    };
  },

  buildFileInfo(intoDir, templateVariables, file) {
    let fileInfo = Blueprint.prototype.buildFileInfo.apply(this, arguments);

    if (file === 'package.json') {
      fileInfo.replacer = adjustPackageJson.bind(this);
    }

    return fileInfo;
  },
};
