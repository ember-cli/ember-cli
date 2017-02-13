'use strict';

const RSVP = require('rsvp');
const SilentError = require('silent-error');
const isGitRepo = require('is-git-url');
const validateNpmPackageName = require('validate-npm-package-name');
const temp = require('temp');
const execa = require('execa');
const path = require('path');
const merge = require('ember-cli-lodash-subset').merge;

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const experiments = require('../experiments');

// Automatically track and cleanup temp files at exit
temp.track();

const mkdir = RSVP.denodeify(temp.mkdir);
const Promise = RSVP.Promise;

const DEFAULT_BLUEPRINT_NAME = 'app';

class InstallBlueprintTask extends Task {
  run(options) {
    let cwd = process.cwd();
    let name = options.rawName;
    let blueprintName = options.blueprint;
    let blueprintPaths = this.project.blueprintLookupPaths();

    // If we're in a dry run, pretend we changed directories.
    // Pretending we cd'd avoids prompts in the actual current directory.
    let fakeCwd = path.join(cwd, name);
    let target = options.dryRun ? fakeCwd : cwd;

    let installOptions = {
      target,
      entity: { name },
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      dryRun: options.dryRun,
      targetFiles: options.targetFiles,
      rawArgs: options.rawArgs,
    };

    installOptions = merge(installOptions, options || {});

    return lookupBlueprint(blueprintName, blueprintPaths)
      .then(blueprint => blueprint.install(installOptions));
  }
}

// Given a blueprint name and set of paths to search, looks up the specified
// blueprint. If it detects a git repository URL, it will clone the repository
// and use that as the blueprint. If it detects an npm package name, it will
// install the package and use that as the blueprint.
function lookupBlueprint(blueprintName, paths) {
  // Fast path: if no blueprint is defined, we can fall back to the default app
  // blueprint which we know is available locally.
  if (blueprintName === undefined) {
    return Blueprint.lookup(DEFAULT_BLUEPRINT_NAME, { paths });
  }

  let blueprint;

  // Git URLs are unambiguous, so we can detect and install it now.
  if (isGitRepo(blueprintName)) {
    return downloadBlueprint(blueprintName, fromGit);
  }

  // npm package names, however, are *not* unambiguous because they could also
  // be describing a path on disk. First, we will search the blueprint paths and
  // prefer anything that we find locally.
  try {
    blueprint = Blueprint.lookup(blueprintName, { paths });
  } catch (err) {

    if (experiments.NPM_BLUEPRINTS) {
      // If we didn't find it locally, we'll see if it's a valid npm package name
      // and install it from npm if so.
      if (maybeNpmPackage(blueprintName)) {
        return downloadBlueprint(blueprintName, fromNpm);
      }
    }

    // Blueprint wasn't found and it couldn't be an npm package, so re-throw the
    // original exception.
    return Promise.reject(err);
  }

  return Promise.resolve(blueprint);
}

function maybeNpmPackage(packageName) {
  return validateNpmPackageName(packageName).validForNewPackages;
}

// Creates a temporary directory, runs a passed callback to install a blueprint
// into that directory, then returns a blueprint loaded from the downloaded
// directory.
function downloadBlueprint(blueprintName, download) {
  // Create a temporary directory
  return mkdir('ember-cli')
    // Download the blueprint into the temporary directory by calling the
    // provided callback.
    .then(tempPath => download(blueprintName, tempPath))
    // The download callback returns a promise that resolves to the final path
    // of the downloaded blueprint, so we load it and resolve with it.
    .then(blueprintPath => Blueprint.load(blueprintPath));
}

// Clone the blueprint with git, then run npm install inside the cloned
// repository so it has all of its dependencies.
function fromGit(blueprintName, tempPath) {
  return execa('git', ['clone', blueprintName, tempPath])
    .then(() => execa('npm', ['install'], { cwd: tempPath }))
    .then(() => tempPath);
}

// Install the blueprint with npm. We skip running `npm install` inside like the
// git version because npm handles this for us automatically.
function fromNpm(blueprintName, tempPath) {
  let pkgPath = path.join(tempPath, 'node_modules', blueprintName);

  return execa('npm', ['install', blueprintName], { cwd: tempPath })
    .catch(err => throwNpmError(err))
    .then(() => pkgPath);
}

const NOT_FOUND_REGEXP = /npm ERR! 404 {2}'(\S+)' is not in the npm registry/;

function throwNpmError(err) {
  let match = err.message && err.message.match(NOT_FOUND_REGEXP);

  if (match) {
    let packageName = match[1];

    throw new SilentError(`The package '${packageName}' was not found in the npm registry.`);
  }

  throw err;
}

module.exports = InstallBlueprintTask;
