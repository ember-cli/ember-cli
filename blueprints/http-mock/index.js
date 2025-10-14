'use strict';

const Blueprint = require('../../lib/models/blueprint');
const isPackageMissing = require('ember-cli-is-package-missing');
const SilentError = require('silent-error');

module.exports = {
  description: '[Classic Only] Generates a mock api endpoint in /api prefix.',

  anonymousOptions: ['endpoint-path'],

  locals(options) {
    return {
      path: `/${options.entity.name.replace(/^\//, '')}`,
    };
  },

  beforeInstall(options) {
    if (this.project.isViteProject()) {
      throw new SilentError('The http-mock blueprint is not supported in Vite projects.');
    }

    let serverBlueprint = Blueprint.lookup('server', {
      ui: this.ui,
      project: this.project,
    });

    return serverBlueprint.install(options);
  },

  afterInstall(options) {
    if (!options.dryRun && isPackageMissing(this, 'express')) {
      return this.addPackagesToProject([{ name: 'express', target: '^4.8.5' }]);
    }
  },
};
