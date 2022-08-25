'use strict';

const fs = require('fs-extra');
const execa = require('../utilities/execa');

async function run(ui, files = []) {
  let lintFixScriptName = 'lint:fix:script';
  let cwd = process.cwd();
  if (files.length === 0) {
    files.push('.');
  }
  let packageJson = fs.readJsonSync('package.json');

  let hasLintFixScript = !!packageJson.scripts[lintFixScriptName];

  if (!hasLintFixScript) {
    ui.writeWarnLine(
      `Lint fix skipped: "${lintFixScriptName}" not found in package.json scripts. New files might not pass linting.`
    );

    return;
  }

  let usingYarn = fs.existsSync('yarn.lock');

  if (usingYarn) {
    let args = [lintFixScriptName, '--'];
    await execa('yarn', args.concat(files), { cwd });
  } else {
    let args = ['run', lintFixScriptName, '--'];
    await execa('npm', args.concat(files), { cwd });
  }
}

module.exports = {
  run,
};
