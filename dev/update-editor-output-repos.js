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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VARIANT = process.env.VARIANT;
const VALID_VARIANT = ['javascript', 'typescript'];

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN must be set');
}

async function updateOnlineEditorRepos() {
  if (!isStable) {
    console.log(`Current version is ${currentVersion}, which is not considered stable.`);
    return;
  }

  if (!VALID_VARIANT.includes(VARIANT)) {
    throw new Error(`Invalid VARIANT specified: ${VARIANT}`);
  }

  let repo = `https://${GITHUB_TOKEN}@github.com/ember-cli/editor-output.git`;
  let onlineEditors = ['stackblitz'];

  for (let command of ['new', 'addon']) {
    let isTypeScript = VARIANT === 'typescript';
    let branchSuffix = isTypeScript ? '-typescript' : '';
    let tmpdir = tmp.dirSync();
    await fs.mkdirp(tmpdir.name);

    let name = command === 'new' ? 'my-app' : 'my-addon';
    let projectType = command === 'new' ? 'app' : 'addon';

    let updatedOutputTmpDir = tmp.dirSync();
    console.log(`Running ember ${command} ${name} (for ${VARIANT})`);
    await execa(
      EMBER_PATH,
      [command, name, `--skip-bower`, `--skip-npm`, `--skip-git`, ...(isTypeScript ? ['--typescript'] : [])],
      {
        cwd: updatedOutputTmpDir.name,
        env: {
          /**
           * using --typescript triggers npm's peer resolution features,
           * and since we don't know if the npm package has been released yet,
           * (and therefor) generate the project using the local ember-cli,
           * the ember-cli version may not exist yet.
           *
           * We need to tell npm to ignore peers and just "let things be".
           * Especially since we don't actually care about npm running,
           * and just want the typescript files to generate.
           *
           * See this related issue: https://github.com/ember-cli/ember-cli/issues/10045
           */
          // eslint-disable-next-line camelcase
          npm_config_legacy_peer_deps: 'true',
        },
      }
    );

    // node_modules is .gitignored, but since we already need to remove package-lock.json due to #10045,
    // we may as well remove node_modules as while we're at it, just in case.
    await execa('rm', ['-rf', 'node_modules', 'package-lock.json'], { cwd: updatedOutputTmpDir.name });

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

async function main() {
  await updateOnlineEditorRepos();
}

main();
