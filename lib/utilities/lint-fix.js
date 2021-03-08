'use strict';

const fs = require('fs-extra');
const execa = require('../utilities/execa');

async function run(ui) {
  let lintFixScriptName = 'lint:fix';
  let cwd = process.cwd();
  let packageJson = fs.readJsonSync('package.json');

  let hasLintFixScript = !!packageJson.scripts[lintFixScriptName];

  if (!hasLintFixScript) {
    ui.writeWarnLine(
      'Lint fix skipped: "lint:fix" not found in package.json scripts. New files might not pass linting.'
    );

    return;
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
