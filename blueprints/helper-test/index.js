/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');
var friendlyPrefix = 'Unit | Helpers |';

module.exports = {
  description: 'Generates a helper unit test.',

  locals: function(options) {
    return {
      friendlyPrefix: friendlyPrefix,
      dependencyDepth: getDependencyDepth(options)
    };
  }
};
