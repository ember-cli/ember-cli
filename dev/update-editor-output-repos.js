'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const tmp = require('tmp');
const latestVersion = require('latest-version');
const { cloneBranch, clearRepo, generateOutputFiles } = require('./output-repo-helpers');

tmp.setGracefulCleanup();

const ONLINE_EDITOR_FILES = path.join(__dirname, 'online-editors');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VARIANT = process.env.VARIANT;
const VALID_VARIANT = ['javascript', 'typescript'];
const EDITORS = ['stackblitz'];
const REPO = 'ember-cli/editor-output';
const [, , version] = process.argv;

assert(GITHUB_TOKEN, 'GITHUB_TOKEN must be set');
assert(
  VALID_VARIANT.includes(VARIANT),
  `Invalid VARIANT env var specified: ${VARIANT}. Must be one of ${VALID_VARIANT}`
);

assert(version, 'a version must be provided as the first argument to this script.');

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

async function push(repoPath, { branch }) {
  console.log('pushing commit');

  try {
    await execa('git', ['push', '--force', 'origin', branch], { cwd: repoPath });
  } catch (e) {
    // branch may not exist yet
    await execa('git', ['push', '-u', 'origin', branch], { cwd: repoPath });
  }
}

async function updateOnlineEditorRepos(version) {
  let infos = await determineOutputs(version);

  console.log(`Updating online editor repo :: ${infos.length} branches`);

  for (let info of infos) {
    let generatedOutputPath = await generateOutputFiles(info);

    let tmpdir = tmp.dirSync();
    await fs.mkdirp(tmpdir.name);

    let outputRepoPath = await cloneBranch(tmpdir.name, info);

    await clearRepo(outputRepoPath);

    console.log('copying generated contents to output repo');
    await fs.copy(generatedOutputPath, outputRepoPath);

    console.log('copying online editor files');
    await fs.copy(path.join(ONLINE_EDITOR_FILES, info.onlineEditor), outputRepoPath);

    console.log('commiting updates');
    await execa('git', ['add', '--all'], { cwd: outputRepoPath });
    await execa('git', ['commit', '-m', info.tag], { cwd: outputRepoPath });

    await push(outputRepoPath, info);
  }
}

updateOnlineEditorRepos(version);
