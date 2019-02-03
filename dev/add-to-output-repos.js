#!/usr/bin/env node
'use strict';

const co = require('co');
const _exec = require('child_process').exec;
const fs = require('fs-extra');

const stableBranch = 'stable';
const betaBranch = 'master';

function exec(command) {
  return new Promise((resolve, reject) => {
    _exec(command, (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout.trim());
    });
  });
}

co(function *() {
  // so you can run this script from any folder and it will find the tmp dir
  process.chdir(yield exec('git rev-parse --show-toplevel'));

  yield fs.ensureDir('tmp');
  process.chdir('tmp');
  let cwd = process.cwd();

  let branch = stableBranch;
  let fork = false;
  if (process.argv[2] === 'beta') {
    if (process.argv[3] === 'fork') {
      fork = true;
    } else {
      branch = betaBranch;
    }
  }

  let emberVersion = (yield exec('ember version')).match(/ember-cli: (.*)/)[1];

  for (let command of ['new', 'addon']) {
    let repoFolder = `ember-${command}-output`;

    let localFolder = `my-${command}`;
    if (command === 'new') {
      localFolder = 'my-app';
    }

    yield exec(`git clone git@github.com:ember-cli/${repoFolder}.git --branch ${branch}`);
    process.chdir(repoFolder);
    yield exec('git rm -rf .');
    yield exec(`ember ${command} ${localFolder} -sb -sn -sg`);
    yield fs.copy(localFolder, '.');
    yield fs.remove(localFolder);

    // start a new beta branch off the just released stable
    if (fork) {
      yield exec(`git branch -d ${betaBranch} || true`);
      yield exec(`git checkout -b ${betaBranch}`);
    }

    yield exec('git add --all');
    yield exec(`git commit -m ${emberVersion}`);
    yield exec(`git tag v${emberVersion}`);
    yield exec(`git push${fork ? ` -f origin ${betaBranch}` : ''}`);
    yield exec('git push --tags');

    process.chdir(cwd);
    yield fs.remove(repoFolder);
  }
});
