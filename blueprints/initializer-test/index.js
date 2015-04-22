/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');
var testInfo = require('../../lib/utilities/test-info');

module.exports = {
  description: 'Generates an initializer unit test.',
  locals: function(options) {
    return {
      friendlyTestName: testInfo.name(options.entity.name, "Unit", "Initializer"),
      dependencyDepth: getDependencyDepth(options)
    };
  }
};
