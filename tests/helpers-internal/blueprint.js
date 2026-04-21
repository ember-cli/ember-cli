'use strict';

const fs = require('fs-extra');

const { globSync } = require('glob');
const { expect } = require('chai');

function confirmViteBlueprint() {
  let pkgJson = fs.readJsonSync('package.json');
  let viteConfig = globSync('vite.config.{js,cjs,mjs}');
  let emberCliUpdate = fs.readJsonSync('config/ember-cli-update.json');

  expect(pkgJson.devDependencies['vite'], 'Installs vite in "devDependencies"').to.exist;
  expect(pkgJson.scripts['start']).to.contain('vite');
  expect(viteConfig.length, 'creates a vite configuration').to.equal(1);
  expect(emberCliUpdate.packages[0].name).to.equal('@ember/app-blueprint');
}

module.exports = {
  confirmViteBlueprint,
};
