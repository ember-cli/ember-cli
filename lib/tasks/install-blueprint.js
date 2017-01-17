'use strict';

const Blueprint = require('../models/blueprint');
const Task = require('../models/task');
const RSVP = require('rsvp');
const isGitRepo = require('is-git-url');
const temp = require('temp');
const childProcess = require('child_process');
const path = require('path');
const merge = require('ember-cli-lodash-subset').merge;

// Automatically track and cleanup temp files at exit
temp.track();

let mkdir = RSVP.denodeify(temp.mkdir);
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

    if (isGitRepo(blueprintOption)) {
      return mkdir('ember-cli').then(pathName => {
        let execArgs = ['git', 'clone', blueprintOption, pathName].join(' ');
        return exec(execArgs).then(() => exec('npm install', { cwd: pathName }).then(() => {
          let blueprint = Blueprint.load(pathName);
          return blueprint.install(installOptions);
        }));
      });
    } else {
      let blueprintName = blueprintOption || 'app';
      let blueprint = Blueprint.lookup(blueprintName, {
        paths: this.project.blueprintLookupPaths(),
      });
      return blueprint.install(installOptions);
    }
  }
}

module.exports = InstallBlueprintTask;
