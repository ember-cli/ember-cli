/*jshint node:true*/

var testInfo = require('../../lib/utilities/test-info');

module.exports = {
  description: 'Generates a util unit test.',
  locals: function(options) {
    return {
      friendlyTestName: testInfo.name(options.entity.name, "Unit", "Utility")
    };
  }
};
