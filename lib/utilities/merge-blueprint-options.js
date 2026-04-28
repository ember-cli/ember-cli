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
  return {
    blueprint: Blueprint.load(blueprintRoot),
    blueprintRoot,
  };
}
function camelToKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}
function inferAllowedOptionNamesFromBlueprintSource(blueprintRoot) {
  let constructorPath = path.join(blueprintRoot, 'index.js');
  if (!fs.existsSync(constructorPath)) {
    return new Set();
  }

  let source = fs.readFileSync(constructorPath, 'utf8');
  let allowed = new Set();
  let match;
  let optionPropertyRegex = /\boptions\.([A-Za-z][A-Za-z0-9_]*)/g;
  while ((match = optionPropertyRegex.exec(source)) !== null) {
    allowed.add(camelToKebab(match[1]));
  }
  return allowed;
}

function inferAllowedOptionNamesFromCommandHook(command, blueprintName) {
  if (typeof command.getExplicitBlueprintPassthroughOptions !== 'function') {
    return new Set();
  }
  let configured = command.getExplicitBlueprintPassthroughOptions(blueprintName);
  if (!configured) {
    return new Set();
  }
  if (configured instanceof Set) {
    return configured;
  }
  if (Array.isArray(configured)) {
    return new Set(configured);
  }
  return new Set();
}

function collectAllowedPassthroughOptionNames(command, blueprintName, blueprintRoot) {
  let allowed = inferAllowedOptionNamesFromCommandHook(command, blueprintName);

  if (blueprintRoot) {
    let inferredFromSource = inferAllowedOptionNamesFromBlueprintSource(blueprintRoot);
    inferredFromSource.forEach((name) => allowed.add(name));
  }

  return allowed;
}
function registerExplicitBlueprintPassthroughOptions(rawArgs, command, allowedOptions) {
  if (!allowedOptions || allowedOptions.size === 0) {
    return;
  }

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
    if (optionName && allowedOptions.has(optionName) && !command.hasOption(optionName)) {
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
    let loaded = tryLoadBlueprintFromNodeModules(blueprintName, this.project);
    if (loaded && loaded.blueprint) {
      this.registerOptions(loaded.blueprint);
    }

    if (explicitBlueprint) {
      let allowedOptions = collectAllowedPassthroughOptionNames(this, blueprintName, loaded && loaded.blueprintRoot);
      registerExplicitBlueprintPassthroughOptions(rawArgs, this, allowedOptions);
    }
    SilentError.debugOrThrow(`ember-cli/commands/${this.name}`, e);
  }
};
