'use strict';

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const parseOptions = require('../utilities/parse-options');
const merge = require('ember-cli-lodash-subset').merge;
const logger = require('heimdalljs-logger')('ember-cli:generate-from-blueprint');
const lintFix = require('../utilities/lint-fix');

class GenerateTask extends Task {
  constructor(options) {
    super(options);
    this.blueprintFunction = 'install';
  }

  async run(options) {
    let fileInfos = await this.createBlueprints(options);

    if (!options.skipLintFix) {
      try {
        let fileDisplayPaths = fileInfos.map(({ displayPath }) => displayPath);
        await lintFix.run(fileDisplayPaths);
      } catch (error) {
        logger.error('Lint fix failed');
      }
    }
  }

  async createBlueprints(options) {
    let name = options.args[0];
    let noAddonBlueprint = ['mixin', 'blueprint-test'];

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
      return;
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

    let mainBlueprintFiles = await mainBlueprint[this.blueprintFunction](blueprintOptions);
    let testBlueprintFiles = [];
    if (testBlueprint) {
      if (testBlueprint.locals === Blueprint.prototype.locals) {
        testBlueprint.locals = function (options) {
          return mainBlueprint.locals(options);
        };
      }

      let testBlueprintOptions = merge({}, blueprintOptions, { installingTest: true });

      testBlueprintFiles = await testBlueprint[this.blueprintFunction](testBlueprintOptions);
    }

    if (!addonBlueprint || name.match(/-addon/)) {
      return [...mainBlueprintFiles, ...testBlueprintFiles];
    }
    if (!this.project.isEmberCLIAddon() && blueprintOptions.inRepoAddon === null) {
      return [...mainBlueprintFiles, ...testBlueprintFiles];
    }

    if (addonBlueprint.locals === Blueprint.prototype.locals) {
      addonBlueprint.locals = function (options) {
        return mainBlueprint.locals(options);
      };
    }

    let addonBlueprintOptions = merge({}, blueprintOptions, { installingAddon: true });

    let addonBlueprintFiles = await addonBlueprint[this.blueprintFunction](addonBlueprintOptions);

    return [...mainBlueprintFiles, ...testBlueprintFiles, ...addonBlueprintFiles];
  }

  lookupBlueprint(name, ignoreMissing) {
    return Blueprint.lookup(name, {
      paths: this.project.blueprintLookupPaths(),
      ignoreMissing,
    });
  }
}

module.exports = GenerateTask;
