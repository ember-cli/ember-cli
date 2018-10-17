'use strict';

const stringUtil = require('ember-cli-string-utils');

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
    let files = this.files();
    let filesToRemove = [
      'app/templates/components/welcome-page.hbs',
      'app/components/welcome-page.js',
    ];

    if (!options.welcome) {
      filesToRemove.forEach(fileName => {
        let idx = files.indexOf(fileName);

        files.splice(idx, 1);
      });
    }

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
};
