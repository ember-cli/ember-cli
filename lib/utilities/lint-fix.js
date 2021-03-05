'use strict';

const fs = require('fs-extra');
const chalk = require('chalk');
const execa = require('execa');

async function run() {
  let lintFixScriptName = 'lint:fix';
  let cwd = process.cwd();
  let packageJson = fs.readJsonSync('package.json');
  let hasLintFixScript = !!packageJson.scripts[lintFixScriptName];

  if (!hasLintFixScript) {
    let warningMessage = `"${lintFixScriptName}" not found in package.json scripts`;

    console.warn(chalk.yellow('Lint fix skipped:', warningMessage));

    throw new Error(warningMessage);
  }

  let usingYarn = fs.existsSync('yarn.lock');

  if (usingYarn) {
    await execa('yarn', [lintFixScriptName], { cwd });
  } else {
    await execa('npm', ['run', lintFixScriptName], { cwd });
  }
}

module.exports = {
  run,
};
