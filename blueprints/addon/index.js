'use strict';

const fs = require('fs-extra');
const existsSync = require('exists-sync');
const path = require('path');
const walkSync = require('walk-sync');
const stringUtil = require('ember-cli-string-utils');
const uniq = require('ember-cli-lodash-subset').uniq;
const SilentError = require('silent-error');
const sortPackageJson = require('sort-package-json');
let date = new Date();

const normalizeEntityName = require('ember-cli-normalize-entity-name');
const stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');

module.exports = {
  description: 'The default blueprint for ember-cli addons.',

  generatePackageJson() {
    let contents = this._readContentsFromFile('package.json');

    delete contents.private;
    contents.name = '<%= addonName %>';
    contents.description = this.description;
    contents.scripts = contents.scripts || {};
    contents.keywords = contents.keywords || [];
    contents.dependencies = contents.dependencies || {};
    contents.devDependencies = contents.devDependencies || {};

    // npm doesn't like it when we have something in both deps and devDeps
    // and dummy app still uses it when in deps
    contents.dependencies['ember-cli-babel'] = contents.devDependencies['ember-cli-babel'];
    delete contents.devDependencies['ember-cli-babel'];

    // 99% of addons don't need ember-data, make it opt-in instead
    delete contents.devDependencies['ember-data'];

    // 100% of addons don't need ember-cli-app-version, make it opt-in instead
    delete contents.devDependencies['ember-cli-app-version'];

    if (contents.keywords.indexOf('ember-addon') === -1) {
      contents.keywords.push('ember-addon');
    }

    // add `ember-disable-prototype-extensions` to addons by default
    contents.devDependencies['ember-disable-prototype-extensions'] = '^1.1.0';

    // use `ember-try` as test script in addons by default
    contents.scripts.test = 'ember try:each';

    contents['ember-addon'] = contents['ember-addon'] || {};
    contents['ember-addon'].configPath = 'tests/dummy/config';

    this._writeContentsToFile(sortPackageJson(contents), 'package.json');
  },

  generateBowerJson() {
    let contents = this._readContentsFromFile('bower.json');

    contents.name = '<%= addonName %>';

    this._writeContentsToFile(contents, 'bower.json');
  },

  afterInstall() {
    let packagePath = path.join(this.path, 'files', 'package.json');
    let bowerPath = path.join(this.path, 'files', 'bower.json');

    [packagePath, bowerPath].forEach(filePath => {
      fs.remove(filePath);
    });
  },

  locals(options) {
    let entity = { name: 'dummy' };
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);
    let namespace = stringUtil.classify(rawName);

    let addonEntity = options.entity;
    let addonRawName = addonEntity.name;
    let addonName = stringUtil.dasherize(addonRawName);
    let addonNamespace = stringUtil.classify(addonRawName);

    return {
      name,
      modulePrefix: name,
      namespace,
      addonName,
      addonModulePrefix: addonName,
      addonNamespace,
      emberCLIVersion: require('../../package').version,
      year: date.getFullYear(),
    };
  },

  files() {
    if (this._files) { return this._files; }

    this._appBlueprint = this.lookupBlueprint('app');
    let appFiles = this._appBlueprint.files();

    this.generatePackageJson();
    this.generateBowerJson();

    let addonFiles = walkSync(path.join(this.path, 'files'));

    return this._files = uniq(appFiles.concat(addonFiles));
  },

  mapFile() {
    let result = this._super.mapFile.apply(this, arguments);
    return this.fileMapper(result);
  },

  fileMap: {
    '^app/.gitkeep': 'app/.gitkeep',
    '^app.*': 'tests/dummy/:path',
    '^config.*': 'tests/dummy/:path',
    '^public.*': 'tests/dummy/:path',

    '^addon-config/environment.js': 'config/environment.js',
    '^addon-config/ember-try.js': 'config/ember-try.js',

    '^npmignore': '.npmignore',
  },

  fileMapper(path) {
    for (let pattern in this.fileMap) {
      if ((new RegExp(pattern)).test(path)) {
        return this.fileMap[pattern].replace(':path', path);
      }
    }

    return path;
  },

  srcPath(file) {
    let filePath = path.resolve(this.path, 'files', file);
    if (existsSync(filePath)) {
      return filePath;
    } else {
      return path.resolve(this._appBlueprint.path, 'files', file);
    }
  },

  normalizeEntityName(entityName) {
    entityName = normalizeEntityName(entityName);

    if (this.project.isEmberCLIProject() && !this.project.isEmberCLIAddon()) {
      throw new SilentError('Generating an addon in an existing ember-cli project is not supported.');
    }

    return entityName;
  },

  _readContentsFromFile(fileName) {
    let packagePath = path.join(this._appBlueprint.path, 'files', fileName);
    return fs.readJsonSync(packagePath);
  },

  _writeContentsToFile(contents, fileName) {
    let packagePath = path.join(this.path, 'files', fileName);
    fs.writeFileSync(packagePath, stringifyAndNormalize(contents));
  },
};
