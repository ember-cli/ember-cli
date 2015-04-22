/*jshint node:true*/

var ModelBlueprint = require('../model');

module.exports = {
  description: 'Generates a model unit test.',

  locals: function(options) {
    var result = ModelBlueprint.locals.apply(this, arguments);

    result.friendlyDescription = 'Unit | Models | ' + options.entity.name;

    return result;
  }
};
