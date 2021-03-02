'use strict';

const execa = require('execa');

function eslint(filePaths) {
  return execa('eslint', [...filePaths, '--fix'], { cwd: process.cwd(), preferLocal: true });
}

function emberTemplateLint(filePaths) {
  return execa('ember-template-lint', [...filePaths, '--fix'], { cwd: process.cwd(), preferLocal: true });
}

function run(filePaths = []) {
  let jsPaths = filePaths.filter((path) => path.endsWith('.js'));
  let hbsPaths = filePaths.filter((path) => path.endsWith('.hbs'));

  let lintFixProcesses = [];

  if (jsPaths.length) {
    lintFixProcesses.push(eslint(jsPaths));
  }

  if (hbsPaths.length) {
    lintFixProcesses.push(emberTemplateLint(hbsPaths));
  }

  return Promise.all(lintFixProcesses);
}

module.exports = {
  run,
};
