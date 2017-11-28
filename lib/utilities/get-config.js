'use strict';

let config;
let Yam = require('yam');
let Project = require('../models/project');

function generateConfig() {
  return new Yam('ember-cli', {
    primary: Project.getProjectRoot(),
  });
}

module.exports = function getConfig(configOverride) {
  if (configOverride) {
    return configOverride;
  }

  if (config === undefined) {
    config = generateConfig();
  }

  return config;
};
