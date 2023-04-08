'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const tmp = require('tmp');
const latestVersion = require('latest-version');
tmp.setGracefulCleanup();

let tmpdir = tmp.dirSync();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN must be set');
}

async function updateRepo(repoName, tag) {
  let latestEC = await latestVersion('ember-cli');
  let latestECBeta = await latestVersion('ember-cli', { version: 'beta' });

  let command = repoName === 'ember-new-output' ? 'new' : 'addon';
  let name = repoName === 'ember-new-output' ? 'my-app' : 'my-addon';
  let outputRepoPath = path.join(tmpdir.name, repoName);
  let isStable = !tag.includes('-beta');

  /**
    * If we always push to either stable or master, how to re re-run old branches?
    * do we need to change how this works?
    */
  let outputRepoBranch = isStable ? 'stable' : 'master';
  let shouldUpdateMasterFromStable = currentVersion.endsWith('-beta.1');
  let branchToClone = shouldUpdateMasterFromStable ? 'stable' : outputRepoBranch;

  console.log(`cloning ${repoName}`);
  await execa(
    'git',
    ['clone', `https://${GITHUB_TOKEN}@github.com/ember-cli/${repoName}.git`, `--branch=${branchToClone}`],
    {
      cwd: tmpdir.name,
    }
  );

  console.log(`clearing ${repoName}`);
  await execa(`git`, [`rm`, `-rf`, `.`], {
    cwd: path.join(tmpdir.name, repoName),
  });

  let updatedOutputTmpDir = tmp.dirSync();
  console.log(`Running ember ${command} ${name}`);
  await execa('npx', [`ember-cli@${tag}`, command, name, `--skip-npm`, `--skip-git`], {
    cwd: updatedOutputTmpDir.name,
  });

  let generatedOutputPath = path.join(updatedOutputTmpDir.name, name);

  console.log('copying generated contents to output repo');
  await fs.copy(generatedOutputPath, outputRepoPath);

  if (shouldUpdateMasterFromStable) {
    await execa('git', ['checkout', '-B', 'master'], { cwd: outputRepoPath });
  }

  console.log('commiting updates');
  await execa('git', ['add', '--all'], { cwd: outputRepoPath });
  await execa('git', ['commit', '-m', currentVersion], { cwd: outputRepoPath });
  await execa('git', ['tag', `v${currentVersion}`], { cwd: outputRepoPath });

  console.log('pushing commit & tag');
  await execa('git', ['push', 'origin', `v${currentVersion}`], { cwd: outputRepoPath });
  await execa('git', ['push', '--force', 'origin', outputRepoBranch], { cwd: outputRepoPath });
}

async function main(tag) {
  await updateRepo('ember-new-output', tag);
  await updateRepo('ember-addon-output', tag);
}

const [, , tag] = process.argv;

assert(tag, 'a tag must be provided as the first argument to this script.');

main(tag);
