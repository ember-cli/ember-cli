'use strict';

const execa = require('../utilities/execa');
const isYarnProject = require('../utilities/is-yarn-project');
const prependEmoji = require('../utilities/prepend-emoji');

async function run(project) {
  let lintFixScriptName = 'lint:fix';
  let hasLintFixScript = Boolean(project.pkg.scripts[lintFixScriptName]);

  if (!hasLintFixScript) {
    project.ui.writeWarnLine(
      `Lint fix skipped: "${lintFixScriptName}" script not found in "package.json". New files might not pass linting.`
    );

    return;
  }

  project.ui.writeLine('');
  project.ui.writeLine(prependEmoji('✨', `Running "${lintFixScriptName}" script...`));

  let cwd = process.cwd();

  if (isYarnProject(project.root)) {
    await execa('yarn', [lintFixScriptName], { cwd });
  } else {
    await execa('npm', ['run', lintFixScriptName], { cwd });
  }
}

module.exports = {
  run,
};
