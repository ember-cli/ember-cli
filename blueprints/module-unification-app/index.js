'use strict';

const fs = require('fs-extra');
const path = require('path');
const uniq = require('ember-cli-lodash-subset').uniq;
const walkSync = require('walk-sync');
const stringUtil = require('ember-cli-string-utils');

const FileInfo = require('../../lib/models/file-info');

module.exports = {
  description: 'Generates an Ember application with a module unification layout.',

  filesToRemove: [],

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
    };
  },

  files() {
    let appFiles = this.lookupBlueprint('app').files();

    let muAppFilesPath = this.filesPath(this.options);
    let muFiles = walkSync(muAppFilesPath);

    return uniq(appFiles.concat(muFiles));
  },

  buildFileInfo(intoDir, templateVariables, file) {
    let mappedPath = this.mapFile(file, templateVariables);
    let options = {
      action: 'write',
      outputBasePath: path.normalize(intoDir),
      outputPath: path.join(intoDir, mappedPath),
      displayPath: path.normalize(mappedPath),
      inputPath: this.srcPath(file),
      templateVariables,
      ui: this.ui,
    };

    return new FileInfo(options);
  },

  mapFile() {
    let result = this._super.mapFile.apply(this, arguments);
    return this.fileMapper(result);
  },

  fileMap: {
    '^app/index.html': 'src/ui/index.html',
    '^app/router.js': 'src/router.js',
    '^app/components/.gitkeep': 'src/ui/components/.gitkeep',
    '^app/templates/application.hbs': 'src/ui/routes/application/template.hbs',
    '^app/styles/app.css': 'src/ui/styles/app.css',
  },

  fileMapper(path) {
    for (let pattern in this.fileMap) {
      if ((new RegExp(pattern)).test(path)) {
        return this.fileMap[pattern].replace(':path', path);
      }
    }

    return path;
  },

  fileMapTokens(options) {
    return {
      __component__() { return options.locals.component; },
    };
  },

  srcPath(file) {
    let path = `${this.path}/files/${file}`;
    let superPath = `${this.lookupBlueprint('app').path}/files/${file}`;
    return fs.existsSync(path) ? path : superPath;
  },
};
