'use strict';

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const parseOptions = require('../utilities/parse-options');
const { merge } = require('ember-cli-lodash-subset');
const logger = require('heimdalljs-logger')('ember-cli:generate-from-blueprint');
const lintFix = require('../utilities/lint-fix');

class GenerateTask extends Task {
  constructor(options) {
    super(options);
    this.blueprintFunction = 'install';
  }

  async run(options) {
    let result = await this.createBlueprints(options);

    if (options.lintFix) {
      try {
        result = result.flatMap((r) => r);
        await lintFix.run(this.ui, result);
      } catch (error) {
        logger.error('Lint fix failed: %o', error);
      }
    }
  }

  async createBlueprints(options) {
    let name = options.args[0];
    let noAddonBlueprint = ['mixin', 'blueprint-test'];
    let createdFiles = [];

    let mainBlueprint = this.lookupBlueprint(name, options.ignoreMissingMain);
    let testBlueprint = this.lookupBlueprint(`${name}-test`, true);

    // lookup custom addon blueprint
    let addonBlueprint = this.lookupBlueprint(`${name}-addon`, true);

    // otherwise, use default addon-import
    if (noAddonBlueprint.indexOf(name) < 0 && !addonBlueprint && options.args[1]) {
      let mainBlueprintSupportsAddon = mainBlueprint && mainBlueprint.supportsAddon();

      if (mainBlueprintSupportsAddon) {
        addonBlueprint = this.lookupBlueprint('addon-import', true);
      }
    }

    if (options.ignoreMissingMain && !mainBlueprint) {
      return createdFiles;
    }

    if (options.dummy) {
      // don't install test or addon reexport for dummy
      if (this.project.isEmberCLIAddon()) {
        testBlueprint = null;
        addonBlueprint = null;
      }
    }

    let entity = {
      name: options.args[1],
      options: parseOptions(options.args.slice(2)),
    };

    let blueprintOptions = {
      target: this.project.root,
      entity,
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      settings: this.settings,
      testing: this.testing,
      taskOptions: options,
      originBlueprintName: name,
    };

    blueprintOptions = merge(blueprintOptions, options || {});

    let createdMain = await mainBlueprint[this.blueprintFunction](blueprintOptions);
    createdFiles.push(createdMain);

    if (testBlueprint) {
      if (testBlueprint.locals === Blueprint.prototype.locals) {
        testBlueprint.locals = function (options) {
          return mainBlueprint.locals(options);
        };
      }

      let testBlueprintOptions = merge({}, blueprintOptions, { installingTest: true });
      let createdTest = await testBlueprint[this.blueprintFunction](testBlueprintOptions);
      createdFiles.push(createdTest);
    }

    if (!addonBlueprint || name.match(/-addon/)) {
      return createdFiles;
    }
    if (!this.project.isEmberCLIAddon() && blueprintOptions.inRepoAddon === null) {
      return createdFiles;
    }

    if (addonBlueprint.locals === Blueprint.prototype.locals) {
      addonBlueprint.locals = function (options) {
        return mainBlueprint.locals(options);
      };
    }

    let addonBlueprintOptions = merge({}, blueprintOptions, { installingAddon: true });

    let createdAddon = await addonBlueprint[this.blueprintFunction](addonBlueprintOptions);
    createdFiles.push(createdAddon);
    return createdFiles;
  }

  lookupBlueprint(name, ignoreMissing) {
    return Blueprint.lookup(name, {
      paths: this.project.blueprintLookupPaths(),
      ignoreMissing,
    });
  }
}

module.exports = GenerateTask;
