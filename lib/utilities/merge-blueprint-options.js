'use strict';

const fs = require('fs');
const path = require('path');
const SilentError = require('silent-error');
const Blueprint = require('../models/blueprint');
const normalizeBlueprint = require('./normalize-blueprint-option');

const BUILTIN_BLUEPRINT_LOOKUP_NAMES = new Set(['app', 'addon', 'blueprint']);

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

function tryLoadBlueprintFromNodeModules(blueprintName, project) {
  if (blueprintName.startsWith('.') || path.isAbsolute(blueprintName)) {
    return null;
  }
  if (!blueprintName.includes('/') && BUILTIN_BLUEPRINT_LOOKUP_NAMES.has(blueprintName)) {
    return null;
  }
  let searchPaths = [];
  if (project && project.root) {
    searchPaths.push(project.root);
  }
  searchPaths.push(process.cwd());
  let resolvedPkgJson;
  try {
    resolvedPkgJson = require.resolve(path.join(blueprintName, 'package.json'), { paths: searchPaths });
  } catch (_e) {
    return null;
  }
  let blueprintRoot = path.dirname(resolvedPkgJson);
  if (!fs.existsSync(path.join(blueprintRoot, 'index.js'))) {
    return null;
  }
  return Blueprint.load(blueprintRoot);
}

function registerExplicitBlueprintPassthroughOptions(rawArgs, command) {
  let inferredOptions = [];
  for (let i = 0; i < rawArgs.length; i++) {
    let arg = rawArgs[i];
    if (!arg.startsWith('--') || arg === '--') {
      continue;
    }
    if (arg.startsWith('--blueprint')) {
      continue;
    }
    let optionName;
    let optionType = Boolean;
    if (arg.includes('=')) {
      optionName = arg.slice(2).split('=')[0];
      optionType = String;
    } else if (arg.startsWith('--no-')) {
      optionName = arg.slice(5);
    } else {
      optionName = arg.slice(2);
      if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
        optionType = String;
      }
    }
    if (optionName && !command.hasOption(optionName)) {
      inferredOptions.push({ name: optionName, type: optionType });
    }
  }

  if (inferredOptions.length > 0) {
    command.registerOptions({ availableOptions: inferredOptions });
  }
}
module.exports = function (rawArgs) {
  if (rawArgs.length === 0) {
    return;
  }

  let blueprintName = rawArgs[0];
  let explicitBlueprint = false;

  if (this.name === 'new' || this.name === 'addon') {
    let blueprintOption = this.availableOptions.find((option) => option.name === 'blueprint');
    blueprintName = blueprintOption ? blueprintOption.default : this.name;

    for (let i = 0; i < rawArgs.length; i++) {
      if ((rawArgs[i] === '-b' || rawArgs[i] === '--blueprint') && rawArgs[i + 1]) {
        blueprintName = rawArgs[i + 1];
        explicitBlueprint = true;
      } else if (rawArgs[i].startsWith('--blueprint=')) {
        blueprintName = rawArgs[i].split('=')[1];
        explicitBlueprint = true;
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
    blueprint = tryLoadBlueprintFromNodeModules(blueprintName, this.project);
    if (blueprint) {
      this.registerOptions(blueprint);
    }

    if (explicitBlueprint) {
      registerExplicitBlueprintPassthroughOptions(rawArgs, this);
    }
    SilentError.debugOrThrow(`ember-cli/commands/${this.name}`, e);
  }
};
