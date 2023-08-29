'use strict';

const { defaults } = require('ember-cli-lodash-subset');
const MockUI = require('console-ui/mock');
const MockProject = require('../helpers/mock-project');

function createProject() {
  let project = new MockProject();
  project.isEmberCLIProject = function () {
    return true;
  };
  project.config = function () {
    return {};
  };
  return project;
}

module.exports = function CommandOptionsFactory(options) {
  options = options || {};
  return defaults(options, {
    ui: new MockUI(),
    tasks: {},
    project: options.project || createProject(),
    commands: {},
    settings: {},
  });
};
