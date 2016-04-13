'use strict';

var cleanBaseURL = require('clean-base-url');
var debug = require('debug')('ember-cli:testem-url-rewriter');

function TestemUrlRewriterAddon(project) {
  this.name = 'testem-url-rewriter';
  this.project = project;
}

TestemUrlRewriterAddon.prototype.testemMiddleware = function(app) {
  var env = process.env.EMBER_ENV;
  debug('Reading config for environment "%s"', env);

  var config = this.project.config(env);
  debug('config.rootURL = %s', config.rootURL);

  var rootURL = cleanBaseURL(config.rootURL) || '/';
  debug('rootURL = %s', rootURL);

  app.use(function(req, res, next) {
    var oldUrl = req.url;
    if (rootURL !== '/' && oldUrl.indexOf(rootURL) === 0) {
      req.url = '/' + oldUrl.slice(rootURL.length);
      debug('Rewriting %s %s -> %s', req.method, oldUrl, req.url);
    } else {
      debug('Ignoring %s %s', req.method, req.url);
    }

    next();
  });
};

module.exports = TestemUrlRewriterAddon;
