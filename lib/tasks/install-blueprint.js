'use strict';

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const RSVP = require('rsvp');
const isGitRepo = require('is-git-url');
const temp = require('temp');
const childProcess = require('child_process');
const path = require('path');
const merge = require('ember-cli-lodash-subset').merge;

const logger = require('heimdalljs-logger')('ember-cli:tasks:install-blueprint');

// Automatically track and cleanup temp files at exit
temp.track();

let mkdirTemp = RSVP.denodeify(temp.mkdir);
let exec = RSVP.denodeify(childProcess.exec);

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

    if (isGitRepo(name)) {
      return mkdirTemp('ember-cli').then(pathName => {
        logger.info(`Cloning blueprint from git (${name}) into "${pathName}" ...`);
        return this._gitClone(name, pathName).then(() => {

          logger.info(`Running "npm install" in "${pathName}" ...`);
          return exec('npm install', { cwd: pathName });

        }).then(() => {
          logger.info(`Loading blueprint from "${pathName}" ...`);
          return Blueprint.load(pathName);
        });
      });

    } else {
      logger.info(`Looking up blueprint "${name}" ...`);
      return RSVP.resolve().then(() => Blueprint.lookup(name, {
        paths: this.project.blueprintLookupPaths(),
      }));
    }
  }

  _gitClone(source, destination) {
    let execArgs = ['git', 'clone', source, destination].join(' ');
    return exec(execArgs);
  }
}

module.exports = InstallBlueprintTask;
