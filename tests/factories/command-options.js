'use strict';

var defaults      = require('lodash/object/defaults');
var MockUI        = require('../helpers/mock-ui');
var MockAnalytics = require('../helpers/mock-analytics');
var MockProject   = require('../helpers/mock-project');

module.exports = function CommandOptionsFactory(options) {
  var project = new MockProject();
  project.isEmberCLIProject = function() { return true; };
  project.config = function() { return {}; };

  return defaults(options || { }, {
    ui:        new MockUI(),
    analytics: new MockAnalytics(),
    tasks:     {},
    project:   project
  });
};
