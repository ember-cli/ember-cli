'use strict';

const cleanBaseURL = require('../utilities/clean-base-url');

module.exports = function (options, project) {
  let config = project.config(options.environment);
  let rootURL = config.rootURL === '' ? '/' : cleanBaseURL(config.rootURL || '/');

  return `http${options.ssl ? 's' : ''}://${options.host || 'localhost'}:${options.port}${rootURL}`;
};
