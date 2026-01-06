'use strict';

const tmp = require('tmp');
const path = require('path');
const { execa, execaCommand } = require('execa');

async function clearRepo(repoPath) {
  console.log(`clearing repo content in ${repoPath}`);
  await execa(`git`, [`rm`, `-rf`, `.`], {
    cwd: repoPath,
  });
}

async function cloneBranch(containingPath, { repo, branch }) {
  let outputName = 'output-repo';
  let outputRepoPath = path.join(containingPath, outputName);

  console.log(`cloning ${repo} in to ${containingPath}`);

  try {
    await execaCommand(`git clone ${repo} --branch=${branch} ${outputName}`, { cwd: containingPath });
  } catch (e) {
    console.log(`Branch does not exist -- creating fresh (local) repo.`);

    await execaCommand(`git clone ${repo} ${outputName}`, { cwd: containingPath });
    await execaCommand(`git switch -C ${branch}`, { cwd: outputRepoPath });
  }

  return outputRepoPath;
}

let cliOutputCache = {};
/**
 * We can re-use generated projects
 */
async function generateOutputFiles({ name, variant, isTypeScript, version, command }) {
  console.log(Object.keys(cliOutputCache));
  let cacheKey = `${command}-${variant}`;

  if (cliOutputCache[cacheKey]) {
    return cliOutputCache[cacheKey];
  }

  let updatedOutputTmpDir = tmp.dirSync();
  console.log(`Running npx ember-cli@${version} ${command} ${name}`);

  await execa(
    'npx',
    [`ember-cli@${version}`, command, name, `--skip-npm`, `--skip-git`, ...(isTypeScript ? ['--typescript'] : [])],
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

  cliOutputCache[cacheKey] = generatedOutputPath;

  return generatedOutputPath;
}

module.exports = { cloneBranch, clearRepo, generateOutputFiles };
