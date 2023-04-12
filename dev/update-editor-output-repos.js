'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const tmp = require('tmp');
const latestVersion = require('latest-version');
tmp.setGracefulCleanup();

const ONLINE_EDITOR_FILES = path.join(__dirname, 'online-editors');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VARIANT = process.env.VARIANT;
const VALID_VARIANT = ['javascript', 'typescript'];
const EDITORS = ['stackblitz'];

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN must be set');
}

/**
 * The editor output repos differ from the output repos in that
 * the editor output repos use branches for their convention of differentiating between
 * editors and tags/versions/etc.
 *
 * The convention is (for the branch names):
 *  - {onlineEditor}-{projectType}-output{-VARIANT?}{-tag?}
 *
 *    Examples:
 *      stackblitz-addon-output-typescript
 *      stackblitz-app-output-typescript-v4.10.0
 *      codesandbox-app-output-v4.10.0
 *
 * For every tag, we generate
 *  - 2 variants (js and ts)
 *    * 2 project types (app and addon)
 *      * # of supported editors with custom configurations
 *   (4 at the time of writing)
 *
 *
 *   TODO: flatten the triple-nested for loop into
 *    - a function that returns a list of objects containing the information
 *    - have a single loop that iterates over that doing all the git stuff
 */

/**
 * Returns an array of objects containing config for operations to attempt.
 * This allows for reduced nesting / conditionals when working with the file system and git
 *
 * This also allows for easier debugging, reproducibility, testing (if we ever add that), etc
 */
async function determineOutputs(version) {
  let tag = `v${version}`;
  let latestEC = await latestVersion('ember-cli');
  let isLatest = version === latestEC;
  let repo = `https://github-actions:${GITHUB_TOKEN}@github.com/${REPO}.git`;

  let result = [];

  for (let command of ['new', 'addon']) {
    let isTypeScript = VARIANT === 'typescript';
    let branchSuffix = isTypeScript ? '-typescript' : '';

    /**
     * If we're working with the latest tag, we want to update the default
     * branch for an editor as well as the tagged version.
     */
    let getBranches = (onlineEditor, projectType) => {
      let editorBranch = `${onlineEditor}-${projectType}-output${branchSuffix}`;

      if (isLatest) {
        return [editorBranch, `${editorBranch}-${tag}`];
      }

      return [`${editorBranch}-${tag}`];
    };

    let name = command === 'new' ? 'my-app' : 'my-addon';
    let projectType = command === 'new' ? 'app' : 'addon';

    for (let onlineEditor of EDITORS) {
      let branches = getBranches(onlineEditor, projectType);

      for (let editorBranch of branches) {
        result.push({
          variant: VARIANT,
          isLatest,
          isTypeScript,
          tag,
          version,
          command,
          name,
          projectType,
          repo,
          onlineEditor,
          branch: editorBranch,
        });
      }
    }
  }

  return result;
}

async function updateOnlineEditorRepos(tag) {
  let latestEC = await latestVersion('ember-cli');
  let isLatest = tag === `v${latestEC}`;

  if (!VALID_VARIANT.includes(VARIANT)) {
    throw new Error(`Invalid VARIANT specified: ${VARIANT}`);
  }

  let repo = `https://${GITHUB_TOKEN}@github.com/ember-cli/editor-output.git`;
  let onlineEditors = ['stackblitz'];

  for (let command of ['new', 'addon']) {
    let isTypeScript = VARIANT === 'typescript';
    let branchSuffix = isTypeScript ? '-typescript' : '';

    /**
     * If we're working with the latest tag, we want to update the default
     * branch for an editor as well as the tagged version.
     */
    let getBranches = (onlineEditor, projectType) => {
      let editorBranch = `${onlineEditor}-${projectType}-output${branchSuffix}`;

      if (isLatest) {
        return [editorBranch, `${editorBranch}-${tag}`];
      }

      return [`${editorBranch}-${tag}`];
    };

    let tmpdir = tmp.dirSync();
    await fs.mkdirp(tmpdir.name);

    let name = command === 'new' ? 'my-app' : 'my-addon';
    let projectType = command === 'new' ? 'app' : 'addon';

    let updatedOutputTmpDir = tmp.dirSync();
    console.log(`Running ember ${command} ${name} (for ${VARIANT})`);
    await execa(
      'npx',
      [`ember-cli@${tag}`, command, name, `--skip-npm`, `--skip-git`, ...(isTypeScript ? ['--typescript'] : [])],
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
      let branches = getBranches(onlineEditor, projectType);

      for (let editorBranch of branches) {
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
        await execa('git', ['commit', '-m', tag], { cwd: outputRepoPath });

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

const [, , tag] = process.argv;

assert(tag, 'a tag must be provided as the first argument to this script.');

updateOnlineEditorRepos(tag);
