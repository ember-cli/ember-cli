'use strict';

var defaults      = require('lodash/object/defaults');
var MockUI        = require('../helpers/mock-ui');
var MockAnalytics = require('../helpers/mock-analytics');

module.exports = function CommandOptionsFactory(options) {
  return defaults(options || { }, {
    ui:        new MockUI(),
    analytics: new MockAnalytics(),
    tasks:     {},
    project:   {
      isEmberCLIProject: function isEmberCLIProject() {
        return true;
      },
      config: function() {
        return {};
      }
    }
  });
};
