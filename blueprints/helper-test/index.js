/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');

module.exports = {
  description: 'Generates a helper unit test.',
  locals: function(options) {
    return {
      dependencyDepth: getDependencyDepth(options)
    }
  }
};
