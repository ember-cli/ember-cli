'use strict';

const fs = require('fs-extra');
const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const RSVP = require('rsvp');
const temp = require('temp');
const path = require('path');
const merge = require('ember-cli-lodash-subset').merge;
const execa = require('../utilities/execa');
const SilentError = require('silent-error');
const npa = require('npm-package-arg');

const logger = require('heimdalljs-logger')('ember-cli:tasks:install-blueprint');

const NOT_FOUND_REGEXP = /npm ERR! 404 {2}'(\S+)' is not in the npm registry/;

// Automatically track and cleanup temp files at exit
temp.track();

let mkdirTemp = RSVP.denodeify(temp.mkdir);

class InstallBlueprintTask extends Task {
  run(options) {
    let cwd = process.cwd();
    let name = options.rawName;
    let blueprintOption = options.blueprint;
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

    return this._resolveBlueprint(blueprintOption).then(blueprint => {
      logger.info(`Installing blueprint into "${target}" ...`);
      return blueprint.install(installOptions);
    });
  }

  _resolveBlueprint(name) {
    name = name || 'app';
    logger.info(`Resolving blueprint "${name}" ...`);

    return this._lookupLocalBlueprint(name).catch(error => this._handleLocalLookupFailure(name, error));
  }

  _lookupLocalBlueprint(name) {
    logger.info(`Looking up blueprint "${name}" locally...`);
    return RSVP.resolve().then(() =>
      Blueprint.lookup(name, {
        paths: this.project.blueprintLookupPaths(),
      })
    );
  }

  _handleLocalLookupFailure(name, error) {
    logger.info(`Local blueprint lookup for "${name}" failed`);

    let packageDescriptor;
    try {
      packageDescriptor = npa(name);
    } catch (err) {
      logger.info(`"${name} is not a valid npm package specifier -> rethrowing original error`);
      throw error;
    }

    logger.info(`"${name} is a valid npm package specifier -> trying npm`);
    return this._tryRemoteBlueprint(packageDescriptor);
  }

  async _tryRemoteBlueprint(packageDescriptor) {
    let tmpDir = await this._createTempFolder();
    let packageName = await this._createPackageJSON(tmpDir, packageDescriptor);

    try {
      await this._npmInstall(tmpDir);
    } catch (error) {
      this._handleNpmInstallModuleError(error); // re-throws
    }

    let blueprintPath = path.resolve(tmpDir, 'node_modules', packageName);
    this._validateNpmModule(blueprintPath, packageName);

    return this._loadBlueprintFromPath(blueprintPath);
  }

  _createTempFolder() {
    return mkdirTemp('ember-cli');
  }

  async _createPackageJSON(tempProjectPath, descriptor) {
    let packageName = descriptor.name || `ember-cli-blueprint-${Date.now()}`;
    let specifier = descriptor.saveSpec || descriptor.fetchSpec;

    await fs.writeFile(
      path.resolve(tempProjectPath, 'package.json'),
      JSON.stringify({
        dependencies: {
          [packageName]: specifier,
        },
      })
    );

    return packageName;
  }

  _npmInstall(cwd) {
    logger.info(`Running "npm install" in "${cwd}" ...`);

    this._copyNpmrc(cwd);
    return execa('npm', ['install'], { cwd });
  }

  _handleNpmInstallModuleError(error) {
    let match = error.stderr && error.stderr.match(NOT_FOUND_REGEXP);
    if (match) {
      let packageName = match[1];
      throw new SilentError(`The package '${packageName}' was not found in the npm registry.`);
    }

    throw error;
  }

  _validateNpmModule(modulePath, packageName) {
    logger.info(`Checking for "ember-blueprint" keyword in "${packageName}" module ...`);
    let pkg = require(path.join(modulePath, 'package.json'));
    if (!pkg || !pkg.keywords || pkg.keywords.indexOf('ember-blueprint') === -1) {
      throw new SilentError(`The package '${packageName}' is not a valid Ember CLI blueprint.`);
    }
  }

  _loadBlueprintFromPath(path) {
    logger.info(`Loading blueprint from "${path}" ...`);
    return RSVP.resolve().then(() => Blueprint.load(path));
  }

  /*
   * NPM has 4 places it uses for .npmrc. 3 of the 4 are supported as their locations
   * are external to the project root but if there is an .npmrc file located at the project root it will
   * not be respected. This is because we create a tmp directory (createTempFolder) where we run
   * the npm install. This function simply copies over the .npmrc file to the tmp directory so that it
   * will be used during the install of the blueprint. Useful for installing private blueprints
   * such as `ember init -b @company/company-specific-blueprint` where the module is in a different
   * registry.
   */
  _copyNpmrc(tmpDir) {
    let rcPath = path.join(this.project.root, '.npmrc');
    let tempLocation = path.join(tmpDir, '.npmrc');

    if (fs.existsSync(rcPath)) {
      fs.copySync(rcPath, tempLocation, {
        dereference: true,
      });
    }
  }
}

module.exports = InstallBlueprintTask;
