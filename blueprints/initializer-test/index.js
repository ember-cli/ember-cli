/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');
var friendlyPrefix = 'Unit | Initializers |';

module.exports = {
  description: 'Generates an initializer unit test.',

  locals: function(options) {
    return {
      friendlyPrefix: friendlyPrefix,
      dependencyDepth: getDependencyDepth(options)
    };
  }
};
