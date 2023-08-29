'use strict';

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const parseOptions = require('../utilities/parse-options');
const logger = require('heimdalljs-logger')('ember-cli:generate-from-blueprint');
const lintFix = require('../utilities/lint-fix');

class GenerateTask extends Task {
  constructor(options) {
    super(options);
    this.blueprintFunction = 'install';
  }

  async run(options) {
    await this.createBlueprints(options);

    if (options.lintFix) {
      try {
        await lintFix.run(this.project);
      } catch (error) {
        logger.error('Lint fix failed: %o', error);
      }
    }
  }

  async createBlueprints(options) {
    let name = options.args[0];
    let noAddonBlueprint = ['mixin', 'blueprint-test'];

    let entity = {
      name: options.args[1],
      options: parseOptions(options.args.slice(2)),
    };

    let baseBlueprintOptions = {
      target: this.project.root,
      entity,
      ui: this.ui,
      project: this.project,
      settings: this.settings,
      testing: this.testing,
      taskOptions: options,
      originBlueprintName: name,
    };

    let mainBlueprintOptions = { ...baseBlueprintOptions, ...options };
    let testBlueprintOptions = { ...mainBlueprintOptions, installingTest: true };
    let addonBlueprintOptions = { ...mainBlueprintOptions, installingAddon: true };

    let mainBlueprint = this.lookupBlueprint(name, {
      blueprintOptions: mainBlueprintOptions,
      ignoreMissing: options.ignoreMissingMain,
    });

    let testBlueprint = this.lookupBlueprint(`${name}-test`, {
      blueprintOptions: testBlueprintOptions,
      ignoreMissing: true,
    });

    let addonBlueprint = this.lookupBlueprint(`${name}-addon`, {
      blueprintOptions: addonBlueprintOptions,
      ignoreMissing: true,
    });

    // otherwise, use default addon-import
    if (noAddonBlueprint.indexOf(name) < 0 && !addonBlueprint && options.args[1]) {
      let mainBlueprintSupportsAddon = mainBlueprint && mainBlueprint.supportsAddon();

      if (mainBlueprintSupportsAddon) {
        addonBlueprint = this.lookupBlueprint('addon-import', {
          blueprintOptions: addonBlueprintOptions,
          ignoreMissing: true,
        });
      }
    }

    if (options.ignoreMissingMain && !mainBlueprint) {
      return;
    }

    if (options.dummy) {
      // don't install test or addon reexport for dummy
      if (this.project.isEmberCLIAddon()) {
        testBlueprint = null;
        addonBlueprint = null;
      }
    }

    await mainBlueprint[this.blueprintFunction](mainBlueprintOptions);
    if (testBlueprint) {
      if (testBlueprint.locals === Blueprint.prototype.locals) {
        testBlueprint.locals = function (options) {
          return mainBlueprint.locals(options);
        };
      }

      await testBlueprint[this.blueprintFunction](testBlueprintOptions);
    }

    if (!addonBlueprint || name.match(/-addon/)) {
      return;
    }
    if (!this.project.isEmberCLIAddon() && mainBlueprintOptions.inRepoAddon === null) {
      return;
    }

    if (addonBlueprint.locals === Blueprint.prototype.locals) {
      addonBlueprint.locals = function (options) {
        return mainBlueprint.locals(options);
      };
    }

    return addonBlueprint[this.blueprintFunction](addonBlueprintOptions);
  }

  lookupBlueprint(name, { blueprintOptions, ignoreMissing }) {
    return Blueprint.lookup(name, {
      blueprintOptions,
      ignoreMissing,
      paths: this.project.blueprintLookupPaths(),
    });
  }
}

module.exports = GenerateTask;
