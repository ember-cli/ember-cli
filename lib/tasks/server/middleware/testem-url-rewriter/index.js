'use strict';

var cleanBaseURL = require('clean-base-url');
var logger = require('heimdalljs-logger')('ember-cli:testem-url-rewriter');

function TestemUrlRewriterAddon(project) {
  this.name = 'testem-url-rewriter';
  this.project = project;
}

TestemUrlRewriterAddon.prototype.testemMiddleware = function(app) {
  var env = process.env.EMBER_ENV;
  logger.info('Reading config for environment "%s"', env);

  var config = this.project.config(env);
  logger.info('config.rootURL = %s', config.rootURL);

  this.project.ui.writeDeprecateLine(
    'Using the `baseURL` setting is deprecated, use `rootURL` instead.',
    !(!('rootURL' in config) && config.baseURL));

  this.project.ui.writeWarnLine(
    'The `baseURL` and `rootURL` settings should not be used at the same time.',
    !(('rootURL' in config) && config.baseURL));

  var rootURL = cleanBaseURL(config.rootURL) || '/';
  logger.info('rootURL = %s', rootURL);

  app.use(function(req, res, next) {
    var oldUrl = req.url;
    if (rootURL !== '/' && oldUrl.indexOf(rootURL) === 0) {
      req.url = '/' + oldUrl.slice(rootURL.length);
      logger.info('Rewriting %s %s -> %s', req.method, oldUrl, req.url);
    } else {
      logger.info('Ignoring %s %s', req.method, req.url);
    }

    next();
  });
};

module.exports = TestemUrlRewriterAddon;
