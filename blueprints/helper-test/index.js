/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');
var testInfo = require('../../lib/utilities/test-info');

module.exports = {
  description: 'Generates a helper unit test.',
  locals: function(options) {
    return {
      friendlyTestName: testInfo.name(options.entity.name, "Unit", "Helper"),
      dependencyDepth: getDependencyDepth(options)
    };
  }
};
