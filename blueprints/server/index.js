'use strict';

const isPackageMissing = require('ember-cli-is-package-missing');
const { deprecate } = require('../../lib/debug');

module.exports = {
  description: 'Generates a server directory for mocks and proxies.',

  normalizeEntityName() {},

  afterInstall(options) {
    let isMorganMissing = isPackageMissing(this, 'morgan');
    let isGlobMissing = isPackageMissing(this, 'glob');

    let areDependenciesMissing = isMorganMissing || isGlobMissing;
    let libsToInstall = [];

    if (isMorganMissing) {
      libsToInstall.push({ name: 'morgan', target: '^1.3.2' });
    }

    if (isGlobMissing) {
      libsToInstall.push({ name: 'glob', target: '^4.0.5' });
    }

    if (!options.dryRun && areDependenciesMissing) {
      return this.addPackagesToProject(libsToInstall);
    }
  },

  files() {
    return ['server/index.js', this.hasJSHint() ? 'server/.jshintrc' : 'server/.eslintrc.js'];
  },

  hasJSHint() {
    let hasJSHint = Boolean(this.project) && 'ember-cli-jshint' in this.project.dependencies();

    deprecate('Support for `ember-cli-jshint` is deprecated. We recommend using `eslint` instead.', !hasJSHint, {
      for: 'ember-cli',
      id: 'ember-cli.ember-cli-jshint-support',
      since: {
        available: '4.6.0',
        enabled: '4.6.0',
      },
      until: '5.0.0',
    });

    return hasJSHint;
  },
};
