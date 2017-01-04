'use strict';

let defaults = require('ember-cli-lodash-subset').defaults;
let MockUI = require('console-ui/mock');
let MockAnalytics = require('../helpers/mock-analytics');
let MockProject = require('../helpers/mock-project');

function createProject() {
  let project = new MockProject();
  project.isEmberCLIProject = function() { return true; };
  project.config = function() { return {}; };
  return project;
}

module.exports = function CommandOptionsFactory(options) {
  options = options || {};
  return defaults(options, {
    ui: new MockUI(),
    analytics: new MockAnalytics(),
    tasks: {},
    project: options.project || createProject(),
    commands: {},
    settings: {},
  });
};
