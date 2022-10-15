'use strict';

const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const tmp = require('tmp');
tmp.setGracefulCleanup();

const currentVersion = require('../package').version;
const EMBER_PATH = require.resolve('../bin/ember');
const isStable = !currentVersion.includes('-beta');
const ONLINE_EDITOR_FILES = path.join(__dirname, 'online-editors');

let tmpdir = tmp.dirSync();

/**
 * To debug this script without interacting with git, specify
 * DEV_DEBUG="-git"
 *
 * example
 *   DEV_DEBUG="-git" node ./dev/update-output-repos.js
 *   DEV_DEBUG="-git,-new-output,+online-editors" node ./dev/update-output-repos.js
 *
 * available DEV_DEBUG flags:
 *   -git
 *   -new-output
 *   +online-editors
 *   -online-editors
 *
 * flags are comma separated
 */
const { DEV_DEBUG } = process.env;

const debugFlags = (DEV_DEBUG || '').split(',').filter(Boolean);
const hasFlag = (flag) => debugFlags.some((x) => x === flag);
const WITHOUT_GIT = hasFlag('-git');
const WITHOUT_NEW_OUTPUT = hasFlag('-new-output');
const WITH_ONLINE_EDITORS = hasFlag('+online-editors') && !hasFlag('-online-editors');

const GIT_MODIFICATIONS_ENABLED = !WITHOUT_GIT;

if (debugFlags.length > 0) {
  console.log('DEV_DEBUG flags present');
  console.log(`\t${debugFlags}`);
}

async function updateOnlineEditorRepos() {
  if (!WITH_ONLINE_EDITORS) {
    if (!isStable) {
      return;
    }
  }

  let repo = 'git@github.com:ember-cli/editor-output.git';
  let onlineEditors = ['stackblitz', 'codesandbox'];

  /**
   * NOTE: this can't be parallelized because we need to
   *   - interact with git (which doesn't allow concurrent modifications on the same repo)
   */
  for (let command of ['new', 'addon']) {
    let tmpdir = tmp.dirSync();
    await fs.mkdirp(tmpdir.name);

    let name = command === 'new' ? 'my-app' : 'my-addon';
    let projectType = command === 'new' ? 'app' : 'addon';

    let updatedOutputTmpDir = tmp.dirSync();
    console.log(`Running ember ${command} ${name}`);
    await execa(EMBER_PATH, [command, name, `--skip-bower`, `--skip-npm`, `--skip-git`], {
      cwd: updatedOutputTmpDir.name,
    });

    let generatedOutputPath = path.join(updatedOutputTmpDir.name, name);

    for (let onlineEditor of onlineEditors) {
      let logPrefix = `[${onlineEditor}]`;
      let log = (msg) => console.log(`${logPrefix} ${msg}`);

      let editorBranch = `${onlineEditor}-${projectType}-output`;
      let outputRepoPath = path.join(tmpdir.name, 'editor-output');

      if (await fs.pathExists(outputRepoPath)) {
        await fs.rm(outputRepoPath, { recursive: true });
      }

      log(`cloning ${repo} in to ${tmpdir.name}`);
      try {
        // Clear the folder from a previous iteration, so that we can
        // start fresh for each editor
        await execa('git', ['clone', repo, `--branch=${editorBranch}`], {
          cwd: tmpdir.name,
        });
      } catch (e) {
        // branch may not exist yet
        await execa('git', ['clone', repo], {
          cwd: tmpdir.name,
        });
      }

      log(`preparing updates for online editors`);
      await execa('git', ['switch', '-C', editorBranch], { cwd: outputRepoPath });

      log(`clearing ${repo} in ${outputRepoPath}`);
      await execa(`git`, [`rm`, `-rf`, `.`], {
        cwd: outputRepoPath,
      });

      log(`copying generated contents to output repo`);
      await fs.copy(generatedOutputPath, outputRepoPath);

      log(`copying online editor files`);
      let localEditorFiles = path.join(ONLINE_EDITOR_FILES, onlineEditor);
      await fs.copy(localEditorFiles, outputRepoPath, {
        filter(src) {
          return !src.includes('__transforms__');
        },
      });

      let transformsPath = path.join(localEditorFiles, '__transforms__');
      if (await fs.pathExists(transformsPath)) {
        let transformPath = path.join(transformsPath, `${projectType}.js`);

        if (await fs.pathExists(transformPath)) {
          log(`applying transforms for ${onlineEditor}...`);

          // Supported since Node 13
          // eslint-disable-next-line node/no-unsupported-features/es-syntax
          let transform = await import(transformPath);

          await transform.default(outputRepoPath);
        }
      }

      if (GIT_MODIFICATIONS_ENABLED) {
        log(`commiting updates`);
        await execa('git', ['add', '--all'], { cwd: outputRepoPath });
        await execa('git', ['commit', '-m', currentVersion], { cwd: outputRepoPath });
      } else {
        log('skipping committing updates');
      }

      if (GIT_MODIFICATIONS_ENABLED) {
        log(`pushing commit`);
        try {
          await execa('git', ['push', '--force', 'origin', editorBranch], { cwd: outputRepoPath });
        } catch (e) {
          // branch may not exist yet
          await execa('git', ['push', '-u', 'origin', editorBranch], { cwd: outputRepoPath });
        }
      } else {
        log('skipping pushing commit');
      }
    }
  }
}

async function updateRepo(repoName) {
  if (WITHOUT_NEW_OUTPUT) {
    return;
  }

  let command = repoName === 'ember-new-output' ? 'new' : 'addon';
  let name = repoName === 'ember-new-output' ? 'my-app' : 'my-addon';
  let outputRepoPath = path.join(tmpdir.name, repoName);

  let outputRepoBranch = isStable ? 'stable' : 'master';
  let shouldUpdateMasterFromStable = currentVersion.endsWith('-beta.1');
  let branchToClone = shouldUpdateMasterFromStable ? 'stable' : outputRepoBranch;

  console.log(`cloning ${repoName}`);
  await execa('git', ['clone', `git@github.com:ember-cli/${repoName}.git`, `--branch=${branchToClone}`], {
    cwd: tmpdir.name,
  });

  console.log(`clearing ${repoName}`);
  await execa(`git`, [`rm`, `-rf`, `.`], {
    cwd: path.join(tmpdir.name, repoName),
  });

  let updatedOutputTmpDir = tmp.dirSync();
  console.log(`Running ember ${command} ${name}`);
  await execa(EMBER_PATH, [command, name, `--skip-bower`, `--skip-npm`, `--skip-git`], {
    cwd: updatedOutputTmpDir.name,
  });

  let generatedOutputPath = path.join(updatedOutputTmpDir.name, name);

  console.log('copying generated contents to output repo');
  await fs.copy(generatedOutputPath, outputRepoPath);

  if (shouldUpdateMasterFromStable) {
    await execa('git', ['checkout', '-B', 'master'], { cwd: outputRepoPath });
  }

  if (GIT_MODIFICATIONS_ENABLED) {
    console.log('commiting updates');
    await execa('git', ['add', '--all'], { cwd: outputRepoPath });
    await execa('git', ['commit', '-m', currentVersion], { cwd: outputRepoPath });
    await execa('git', ['tag', `v${currentVersion}`], { cwd: outputRepoPath });
  } else {
    console.log('skipping committing updates');
  }

  if (GIT_MODIFICATIONS_ENABLED) {
    console.log('pushing commit & tag');
    await execa('git', ['push', 'origin', `v${currentVersion}`], { cwd: outputRepoPath });
    await execa('git', ['push', '--force', 'origin', outputRepoBranch], { cwd: outputRepoPath });
  } else {
    console.log('skipping pushing commit & tag');
  }
}

async function main() {
  try {
    await updateRepo('ember-new-output');
    await updateRepo('ember-addon-output');
    await updateOnlineEditorRepos();
  } catch (error) {
    console.log(error);
  }
}

main();
