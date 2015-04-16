/*jshint node:true*/

var getDependencyDepth = require('../../lib/utilities/get-dependency-depth');

module.exports = {
  description: 'Generates an initializer unit test.',
  locals: function(options) {
    return {
      dependencyDepth: getDependencyDepth(options)
    }
  }
};
