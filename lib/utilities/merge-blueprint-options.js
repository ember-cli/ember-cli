'use strict';

const SilentError = require('silent-error');
const Blueprint = require('../models/blueprint');
const normalizeBlueprint = require('./normalize-blueprint-option');

/*
 * Helper for commands that use a blueprint to merge the blueprint's options
 * into the command's options so they can be passed in. Needs to be invoked
 * with `this` pointing to the command object, e.g.
 *
 * var mergeBlueprintOptions = require('../utilities/merge-blueprint-options');
 *
 * Command.extend({
 *   beforeRun: mergeBlueprintOptions
 * })
 */
module.exports = function (rawArgs) {
  if (rawArgs.length === 0) {
    return;
  }

  let blueprintName = rawArgs[0];

  if (this.name === 'new' || this.name === 'addon') {
    let blueprintOption = this.availableOptions.find((option) => option.name === 'blueprint');
    blueprintName = blueprintOption ? blueprintOption.default : this.name;

    for (let i = 0; i < rawArgs.length; i++) {
      if ((rawArgs[i] === '-b' || rawArgs[i] === '--blueprint') && rawArgs[i + 1]) {
        blueprintName = rawArgs[i + 1];
      } else if (rawArgs[i].startsWith('--blueprint=')) {
        blueprintName = rawArgs[i].split('=')[1];
      }
    }
  }

  blueprintName = normalizeBlueprint(blueprintName);

  // merge in blueprint availableOptions
  let blueprint;
  try {
    blueprint = Blueprint.lookup(blueprintName, {
      paths: this.project.blueprintLookupPaths(),
    });
    this.registerOptions(blueprint);
  } catch (e) {
    SilentError.debugOrThrow(`ember-cli/commands/${this.name}`, e);
  }
};
