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

async function updateOnlineEditorRepos() {
  if (!isStable) {
    return;
  }

  let repo = 'git@github.com:ember-cli/editor-output.git';
  let onlineEditors = ['stackblitz'];
  let variants = ['javascript', 'typescript'];

  for (let command of ['new', 'addon']) {
    for (let variant of variants) {
      let isTypeScript = variant === 'typescript';
      let branchSuffix = isTypeScript ? '-typescript' : '';
      let tmpdir = tmp.dirSync();
      await fs.mkdirp(tmpdir.name);

      let name = command === 'new' ? 'my-app' : 'my-addon';
      let projectType = command === 'new' ? 'app' : 'addon';

      let updatedOutputTmpDir = tmp.dirSync();
      console.log(`Running ember ${command} ${name} (for ${variant})`);
      await execa(
        EMBER_PATH,
        [command, name, `--skip-bower`, `--skip-npm`, `--skip-git`, ...(isTypeScript ? ['--typescript'] : [])],
        {
          cwd: updatedOutputTmpDir.name,
        }
      );

      let generatedOutputPath = path.join(updatedOutputTmpDir.name, name);

      for (let onlineEditor of onlineEditors) {
        let editorBranch = `${onlineEditor}-${projectType}-output${branchSuffix}`;
        let outputRepoPath = path.join(tmpdir.name, 'editor-output');

        console.log(`cloning ${repo} in to ${tmpdir.name}`);
        try {
          await execa('git', ['clone', repo, `--branch=${editorBranch}`], {
            cwd: tmpdir.name,
          });
        } catch (e) {
          // branch may not exist yet
          await execa('git', ['clone', repo], {
            cwd: tmpdir.name,
          });
        }

        console.log('preparing updates for online editors');
        await execa('git', ['switch', '-C', editorBranch], { cwd: outputRepoPath });

        console.log(`clearing ${repo} in ${outputRepoPath}`);
        await execa(`git`, [`rm`, `-rf`, `.`], {
          cwd: outputRepoPath,
        });

        console.log('copying generated contents to output repo');
        await fs.copy(generatedOutputPath, outputRepoPath);

        console.log('copying online editor files');
        await fs.copy(path.join(ONLINE_EDITOR_FILES, onlineEditor), outputRepoPath);

        console.log('commiting updates');
        await execa('git', ['add', '--all'], { cwd: outputRepoPath });
        await execa('git', ['commit', '-m', currentVersion], { cwd: outputRepoPath });

        console.log('pushing commit');
        try {
          await execa('git', ['push', '--force', 'origin', editorBranch], { cwd: outputRepoPath });
        } catch (e) {
          // branch may not exist yet
          await execa('git', ['push', '-u', 'origin', editorBranch], { cwd: outputRepoPath });
        }
      }
    }
  }
}

async function updateRepo(repoName) {
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

  console.log('commiting updates');
  await execa('git', ['add', '--all'], { cwd: outputRepoPath });
  await execa('git', ['commit', '-m', currentVersion], { cwd: outputRepoPath });
  await execa('git', ['tag', `v${currentVersion}`], { cwd: outputRepoPath });

  console.log('pushing commit & tag');
  await execa('git', ['push', 'origin', `v${currentVersion}`], { cwd: outputRepoPath });
  await execa('git', ['push', '--force', 'origin', outputRepoBranch], { cwd: outputRepoPath });
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
