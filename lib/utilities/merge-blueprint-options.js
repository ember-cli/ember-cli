'use strict';

const SilentError = require('silent-error');
const Blueprint = require('../models/blueprint');
const normalizeBlueprint = require('./normalize-blueprint-option');

module.exports = function (rawArgs) {
  if (rawArgs.length === 0) {
    return;
  }

  // Default behavior:The first argument is the blueprint (e.g., 'ember generate component')
  let blueprintName = rawArgs[0];

  // FIX: The 'new' and 'addon' commands use the first arg as the Project Name, not Blueprint.
  // We need to find the actual blueprint name.
  if (this.name === 'new' || this.name === 'addon') {
    //Start with the default (usually 'app' or 'addon')
    let blueprintOption = this.availableOptions.find((o) => o.name === 'blueprint');
    blueprintName = blueprintOption ? blueprintOption.default : 'app';

    //Check if the user passed -b or --blueprint
    for (let i = 0; i < rawArgs.length; i++) {
      if (rawArgs[i] === '-b' || rawArgs[i] === '--blueprint') {
        // The next argument is the value
        if (rawArgs[i + 1]) {
          blueprintName = rawArgs[i + 1];
        }
      } else if (rawArgs[i].startsWith('--blueprint=')) {
        //Handle --blueprint=name style
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
