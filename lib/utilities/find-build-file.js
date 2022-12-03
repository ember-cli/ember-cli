'use strict';
const findUp = require('find-up');
const path = require('path');
const url = require('url');

module.exports = async function (dir) {
  let buildFilePath = null;

  for (let ext of ['js', 'mjs', 'cjs']) {
    let candidate = findUp.sync(`ember-cli-build.${ext}`, { cwd: dir });
    if (candidate) {
      buildFilePath = candidate;
      break;
    }
  }

  if (buildFilePath === null) {
    return null;
  }

  process.chdir(path.dirname(buildFilePath));

  let buildFileUrl = url.pathToFileURL(buildFilePath);
  try {
    let fn = (await import(buildFileUrl)).default;
    return fn;
  } catch (err) {
    err.message = `Could not \`import('${buildFileUrl}')\`: ${err.message}`;
    throw err;
  }
};
