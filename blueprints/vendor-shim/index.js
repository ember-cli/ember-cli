'use strict';

const stringUtil = require('ember-cli-string-utils');
const { deprecate } = require('../../lib/debug');

module.exports = {
  description: 'Generates an ES6 module shim for global libraries.',

  beforeInstall() {
    deprecate('The `vendor-shim` blueprint is deprecated. Please use `ember-auto-import` instead.', false, {
      for: 'ember-cli',
      id: 'ember-cli.vendor-shim-blueprint',
      since: {
        available: '4.6.0',
        enabled: '4.6.0',
      },
      until: '5.0.0',
    });
  },

  locals(options) {
    let entity = options.entity;
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);

    return {
      name,
    };
  },
};
