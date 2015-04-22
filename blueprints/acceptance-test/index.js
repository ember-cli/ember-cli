/*jshint node:true*/

var testInfo = require('../../lib/utilities/test-info');

module.exports = {
  description: 'Generates an acceptance test for a feature.',
  locals: function(options) {
    return {
      friendlyTestName: testInfo.name(options.entity.name, "Acceptance", null)
    };
  }
};
