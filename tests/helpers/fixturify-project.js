'use strict';

const path = require('path');
const merge = require('ember-cli-lodash-subset').merge;
const FixturifyProject = require('fixturify-project');
const Project = require('../../lib/models/project');
const MockCLI = require('./mock-cli');

// used in these tests to ensure we are only
// operating on the addons added here
class ProjectWithoutInternalAddons extends Project {
  supportedInternalAddonPaths() {
    return [];
  }
}

function prepareAddon(addon) {
  addon.pkg.keywords.push('ember-addon');
  addon.pkg['ember-addon'] = {};
  addon.files['index.js'] = 'module.exports = { name: require("./package").name };';
}

module.exports = class EmberCLIFixturifyProject extends FixturifyProject {
  writeSync() {
    super.writeSync(...arguments);
    this._hasWritten = true;
  }

  addFiles(filesObj) {
    merge(this.files, filesObj);
  }

  buildProjectModel(ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      this.writeSync();
    }

    let pkg = JSON.parse(this.toJSON('package.json'));
    let cli = new MockCLI();
    let root = path.join(this.root, this.name);

    return new ProjectClass(root, pkg, cli.ui, cli);
  }

  addAddon(name, version = '0.0.0', cb) {
    return this.addDependency(name, version, (addon) => {
      prepareAddon(addon);
      if (typeof cb === 'function') {
        cb(addon);
      }
    });
  }

  addDevAddon(name, version = '0.0.0', cb) {
    return this.addDevDependency(name, version, (addon) => {
      prepareAddon(addon);
      if (typeof cb === 'function') {
        cb(addon);
      }
    });
  }

  addEngine(name, version = '0.0.0', isLazy = true, cb) {
    return this.addAddon(name, version, (addon) => {
      addon.pkg.keywords.push('ember-engine');
      addon.files['index.js'] = `
const { name } = require('./package.json');

module.exports = {
  name,
  moduleName: () => name,
  lazyLoading: {
    enabled: ${isLazy}
  }
};
`;
      if (typeof cb === 'function') {
        cb(addon);
      }
    });
  }

  addInRepoAddon(name, version = '0.0.0', cb) {
    const inRepoAddon = new EmberCLIFixturifyProject(name, version, (addon) => {
      addon.pkg.keywords.push('ember-addon');
      addon.pkg['ember-addon'] = {};
      addon.files['index.js'] = 'module.exports = { name: require("./package").name };';

      if (typeof cb === 'function') {
        cb(addon);
      }
    });

    // configure the current project to have an ember-addon configured at the
    // appropriate path, i.e. under a common root directory (lib).
    const addonRootDir = 'lib';

    // Add to ember-addon.paths list
    let addon = (this.pkg['ember-addon'] = this.pkg['ember-addon'] || {});
    addon.paths = addon.paths || [];

    const addonPath = `${addonRootDir}/${name}`;

    if (addon.paths.find((path) => path.toLowerCase() === addonPath.toLowerCase())) {
      throw new Error(`project: ${this.name} already contains the in-repo-addon: ${name}`);
    }

    addon.paths.push(addonPath);

    this.files[addonRootDir] = this.files[addonRootDir] || {};

    let addonJSON = inRepoAddon.toJSON();
    Object.assign(this.files[addonRootDir], addonJSON);
  }

  addInRepoEngine(name, version = '0.0.0', isLazy = true, cb) {
    return this.addInRepoAddon(name, version, (addon) => {
      addon.pkg.keywords.push('ember-engine');
      addon.files['index.js'] = `
'use strict';

const { name } = require('./package.json');

module.exports = {
  name,
  moduleName: () => name,
  lazyLoading: {
    enabled: ${isLazy},
  },
};
`;
      if (typeof cb === 'function') {
        cb(addon);
      }
    });
  }
};
