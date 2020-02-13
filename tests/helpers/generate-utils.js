'use strict';

const fs = require('fs-extra');
const ember = require('./ember');

function inRepoAddon(path) {
  return ember(['generate', 'in-repo-addon', path]);
}

function tempBlueprint() {
  return fs.outputFile('blueprints/foo/files/__root__/foos/__name__.js', '/* whoah, empty foo! */');
}

module.exports = {
  inRepoAddon,
  tempBlueprint,
};
