'use strict';

const { expect } = require('chai');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PACKAGE_FILES, updateDependencies } = require('../../../dev/update-blueprint-dependencies');

describe('updateDependencies', function () {
  it('it works', async function () {
    let dependenciesBeforeUpdate = {
      // Template expression in key:
      '<% if (foo) { %>@glimmer/component': '^1.1.0',

      // Template expression in value:
      '@glimmer/component': '^1.1.0<% if (foo) { %>',
      'ember-cli': '~<%= emberCLIVersion %>',

      // Template expression in key and value:
      '<% } %>@glimmer/component': '^1.1.0<% if (foo) { %>',

      // Without template expressions:
      '@glimmer/tracking': '^1.1.0',
    };

    let dependenciesAfterUpdate = { ...dependenciesBeforeUpdate };

    await updateDependencies(dependenciesAfterUpdate);

    expect(Object.keys(dependenciesAfterUpdate)).to.deep.equal(Object.keys(dependenciesBeforeUpdate));

    for (let dependency in dependenciesAfterUpdate) {
      if (dependency === 'ember-cli') {
        expect(dependenciesAfterUpdate[dependency]).to.equal(dependenciesBeforeUpdate[dependency]);
      } else {
        expect(dependenciesAfterUpdate[dependency]).to.not.equal(dependenciesBeforeUpdate[dependency]);
      }
    }
  });

  it('all package files are parseable', function () {
    for (let pkgFile of PACKAGE_FILES) {
      let pkgPath = join(__dirname, '..', '..', pkgFile);
      let pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf8' }));

      expect(pkg).to.be.ok;
    }
  });
});
