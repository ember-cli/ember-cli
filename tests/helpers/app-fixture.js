'use strict';

const fs = require('fs-extra');
const path = require('path');
const symlinkOrCopySync = require('symlink-or-copy').sync;
const merge = require('ember-cli-lodash-subset').merge;

const fixturify = require('fixturify');
const quickTemp = require('quick-temp');

const originalWorkingDirectory = process.cwd();
const root = path.resolve(__dirname, '..', '..');

const PackageCache = require('../../tests/helpers/package-cache');
const CommandGenerator = require('../../tests/helpers/command-generator');

const ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

function AppFixture(name) {
  this.type = 'app';
  this.command = 'new';
  this.name = name;
  this._installedAddons = [];

  this._init();
}

AppFixture.prototype = {

  _init() {
    process.chdir(root);
    let dirName = `${this.name}-${this.type}-fixture`;
    this.dir = quickTemp.makeOrRemake({}, dirName);
    process.chdir(originalWorkingDirectory);

    this._loadBlueprint();
  },

  _loadBlueprint() {
    fs.removeSync(this.dir);

    ember.invoke(
      this.command,
      this.name,
      `--directory=${this.dir}`,
      '--disable-analytics',
      '--watcher=node',
      '--skip-npm',
      '--skip-bower',
      '--skip-git'
    );

    this.fixture = fixturify.readSync(this.dir);

    // Clean up after the generator.
    fs.removeSync(this.dir);
  },

  serialize(isChild) {
    // Default link ember-cli.
    let npmLinks = [{
      name: 'ember-cli',
      path: root,
    }];
    let inRepoLinks = [];
    let self = this;
    this._installedAddons.forEach(function(addon) {
      addon.serialize(true);

      if (addon.type === 'addon') {
        npmLinks.push({
          name: addon.name,
          path: addon.dir,
        });
      } else if (addon.type === 'in-repo-addon') {
        inRepoLinks.push({
          from: path.join(self.dir, 'lib', addon.name),
          to: addon.dir,
        });
      }
    });

    fixturify.writeSync(this.dir, this.fixture);

    let packageCache = new PackageCache(root);

    let from, to;
    if (this.fixture['package.json'] || npmLinks.length) {
      let nodePackageCache;
      if (isChild) {
        process.env.NODE_ENV = 'production';
        let cacheName = `${this.type}-production-node`;
        nodePackageCache = packageCache.create(cacheName, 'yarn', this.fixture['package.json'], npmLinks);
        delete process.env.NODE_ENV;
      } else {
        let cacheName = `${this.type}-node`;
        nodePackageCache = packageCache.create(cacheName, 'yarn', this.fixture['package.json'], npmLinks);
      }

      from = path.join(nodePackageCache, 'node_modules');
      fs.mkdirsSync(from); // Just in case the path doesn't exist.
      to = path.join(this.dir, 'node_modules');
      symlinkOrCopySync(from, to);
    }

    if (!isChild && this.fixture['bower.json']) {
      let cacheName = `${this.type}-bower`;
      let bowerPackageCache = packageCache.create(cacheName, 'bower', this.fixture['bower.json']);

      from = path.join(bowerPackageCache, 'bower_components');
      fs.mkdirsSync(from); // Just in case the path doesn't exist.
      to = path.join(this.dir, 'bower_components');
      symlinkOrCopySync(from, to);
    }

    inRepoLinks.forEach(function(link) {
      fs.mkdirsSync(path.dirname(link.from)); // Just in case the path doesn't exist.
      fs.mkdirsSync(path.dirname(link.to)); // Just in case the path doesn't exist.
      symlinkOrCopySync(link.to, link.from);
    });

    return this;
  },

  clean() {
    this._installedAddons.forEach(function(addon) {
      addon.clean(true);
    });

    // Build up object to pass to quickTemp.
    let dir = {};
    let dirName = `${this.name}-${this.type}-fixture`;
    dir[dirName] = this.dir;

    process.chdir(root);
    quickTemp.remove(dir, dirName);
    process.chdir(originalWorkingDirectory);

    return this;
  },

  install(addon) {
    this._installedAddons.push(addon);

    if (addon.type === 'addon') {
      return this._npmAddonInstall(addon);
    }

    if (addon.type === 'in-repo-addon') {
      return this._inRepoAddonInstall(addon);
    }

    throw new Error('Cannot install addon.');
  },

  _npmAddonInstall(addon) {
    let config = this.getPackageJSON();

    config['dependencies'] = config['dependencies'] || {};
    config['dependencies'][addon.name] = '*';

    this.setPackageJSON(config);
    return this;
  },

  _inRepoAddonInstall(addon) {
    let config = this.getPackageJSON();

    config['ember-addon'] = config['ember-addon'] || {};
    config['ember-addon']['paths'] = config['ember-addon']['paths'] || [];
    config['ember-addon'].paths.push(`lib/${addon.name}`);

    this.setPackageJSON(config);
    return this;
  },

  uninstall(addon) {
    let needle = addon;
    let haystack = this._installedAddons;

    if (haystack.indexOf(needle) !== -1) {
      this._installedAddons.splice(haystack.indexOf(needle), 1);
    }

    if (addon.type === 'addon') {
      return this._npmAddonUninstall(addon);
    }

    if (addon.type === 'in-repo-addon') {
      return this._inRepoAddonUninstall(addon);
    }

    throw new Error('Cannot uninstall addon.');
  },

  _npmAddonUninstall(addon) {
    let config = this.getPackageJSON();

    config['dependencies'] = config['dependencies'] || {};
    delete config['dependencies'][addon.name];

    this.setPackageJSON(config);
    return this;
  },

  _inRepoAddonUninstall(addon) {
    let config = this.getPackageJSON();

    let needle = `lib/${addon.name}`;
    let haystack = config['ember-addon']['paths'];

    if (haystack.indexOf(needle) !== -1) {
      config['ember-addon']['paths'].splice(haystack.indexOf(needle), 1);
    }

    this.setPackageJSON(config);
    return this;
  },

  getPackageJSON() {
    return JSON.parse(this.fixture['package.json']);
  },

  setPackageJSON(value) {
    return this.fixture['package.json'] = JSON.stringify(value);
  },

  generateFile(fileName, contents) {
    fileName = fileName.replace(/^\//, '');
    let keyPath = fileName.split('/');

    let root = {};
    let cursor = root;
    let i = 0;
    for (i = 0; i < keyPath.length - 1; i++) {
      cursor = cursor[keyPath[i]] = {};
    }
    cursor[keyPath[i]] = contents;

    merge(this.fixture, root);
    return this;
  },

  generateCSS(fileName) {
    let contents = `.${this.name} { content: "${fileName}"; }`;
    return this.generateFile(fileName, contents);
  },

  generateJS(fileName) {
    let contents = `// ${this.name}/${fileName}\nlet a = true;`;
    return this.generateFile(fileName, contents);
  },

  generateTemplate(fileName) {
    let contents = `{{${this.name}}}`;
    return this.generateFile(fileName, contents);
  },
};

module.exports = AppFixture;
