'use strict';

const chalk = require('chalk');
const execa = require('execa');

async function run() {
  let lintFixScriptName = `lint:fix`;
  let cwd = process.cwd();
  let npmRunResult = await execa('npm', ['run'], { cwd });
  let lintFixScriptRegex = new RegExp(`^  ${lintFixScriptName}$`, 'm');
  let hasLintFixScript = lintFixScriptRegex.test(npmRunResult.stdout);

  if (!hasLintFixScript) {
    let warningMessage = `'${lintFixScriptName}' not found in package.json scripts`;

    console.warn(chalk.yellow('Lint fix skipped:', warningMessage));

    return Promise.reject({
      shortMessage: warningMessage,
    });
  }

  await execa('npm', ['run', lintFixScriptName], { cwd });
}

module.exports = {
  run,
};
