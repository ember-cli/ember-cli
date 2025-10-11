'use strict';

const Blueprint = require('../../lib/models/blueprint');
const SilentError = require('silent-error');

module.exports = {
  description: '[Classic Only] Generates a relative proxy to another server.',

  anonymousOptions: ['local-path', 'remote-url'],

  locals(options) {
    let proxyUrl = options.args[2];
    return {
      path: `/${options.entity.name.replace(/^\//, '')}`,
      proxyUrl,
    };
  },

  beforeInstall(options) {
    if (this.project.isViteProject()) {
      throw new SilentError('The http-proxy blueprint is not supported in Vite projects.');
    }

    let serverBlueprint = Blueprint.lookup('server', {
      ui: this.ui,
      project: this.project,
    });

    return serverBlueprint.install(options);
  },

  afterInstall() {
    return this.addPackagesToProject([{ name: 'http-proxy', target: '^1.1.6' }]);
  },
};
