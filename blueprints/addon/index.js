/*jshint node:true*/

var fs          = require('fs');
var existsSync  = require('exists-sync');
var path        = require('path');
var walkSync    = require('walk-sync');
var stringUtil  = require('ember-cli-string-utils');
var uniq        = require('lodash/uniq');
var SilentError = require('silent-error');
var date        = new Date();

var normalizeEntityName = require('ember-cli-normalize-entity-name');

module.exports = {
  description: 'The default blueprint for ember-cli addons.',

  generatePackageJson: function() {
    var contents = readContentsFromFile.call(this, 'package.json');

    delete contents.private;
    contents.name = this.project.name();
    contents.description = this.description;
    contents.scripts = contents.scripts || {};
    contents.keywords = contents.keywords || [];
    contents.dependencies = contents.dependencies || {};
    contents.devDependencies = contents.devDependencies || {};

    // npm doesn't like it when we have something in both deps and devDeps
    // and dummy app still uses it when in deps
    contents.dependencies['ember-cli-babel'] = contents.devDependencies['ember-cli-babel'];
    delete contents.devDependencies['ember-cli-babel'];

    if (contents.keywords.indexOf('ember-addon') === -1) {
      contents.keywords.push('ember-addon');
    }

    // add `ember-disable-prototype-extensions` to addons by default
    contents.devDependencies['ember-disable-prototype-extensions'] = '^1.1.0';

    // add `ember-try` to addons by default
    contents.devDependencies['ember-try'] = '^0.2.2';
    contents.scripts.test = 'ember try:testall';

    contents['ember-addon'] = contents['ember-addon'] || {};
    contents['ember-addon'].configPath = 'tests/dummy/config';

    // sort the dependencies like an `npm install` would
    alphabetizeDependencies(contents);

    writeContentsToFile.call(this, contents, 'package.json');
  },

  generateBowerJson: function() {
    var contents = readContentsFromFile.call(this, 'bower.json');

    contents.name = this.project.name();

    writeContentsToFile.call(this, contents, 'bower.json');
  },

  afterInstall: function() {
    var packagePath = path.join(this.path, 'files', 'package.json');
    var bowerPath = path.join(this.path, 'files', 'bower.json');

    [packagePath, bowerPath].forEach(function(filePath) {
      if (existsSync(filePath)) {
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
    };
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
    var result = this._super(file, locals);
    return this.fileMapper(result);
  },

  fileMap: {
    '^app/.gitkeep': 'app/.gitkeep',
    '^app.*':        'tests/dummy/:path',
    '^config.*':     'tests/dummy/:path',
    '^public.*':     'tests/dummy/:path',

    '^addon-config/environment.js': 'config/environment.js',
    '^addon-config/ember-try.js'  : 'config/ember-try.js',

    '^npmignore': '.npmignore'
  },

  fileMapper: function(path) {
    for (var pattern in this.fileMap) {
      if ((new RegExp(pattern)).test(path)) {
        return this.fileMap[pattern].replace(':path', path);
      }
    }

    return path;
  },

  srcPath: function(file) {
    var filePath = path.resolve(this.path, 'files', file);
    if (existsSync(filePath)) {
      return filePath;
    } else {
      return path.resolve(this._appBlueprint.path, 'files', file);
    }
  },

  normalizeEntityName: function(entityName) {
    entityName = normalizeEntityName(entityName);

    if (this.project.isEmberCLIProject() && !this.project.isEmberCLIAddon()) {
      throw new SilentError('Generating an addon in an existing ember-cli project is not supported.');
    }

    return entityName;
  }
};

function readContentsFromFile(fileName) {
  var packagePath = path.join(this._appBlueprint.path, 'files', fileName);
  return JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));
}

function alphabetizeDependencies(contents) {
  contents.dependencies = alphabetizeObjectKeys(contents.dependencies);
  contents.devDependencies = alphabetizeObjectKeys(contents.devDependencies);
}

function alphabetizeObjectKeys(unordered) {
  var ordered = {};
  Object.keys(unordered).sort().forEach(function(key) {
    ordered[key] = unordered[key];
  });
  return ordered;
}

function writeContentsToFile(contents, fileName) {
  fs.writeFileSync(path.join(this.path, 'files', fileName), JSON.stringify(contents, null, 2) + '\n');
}
