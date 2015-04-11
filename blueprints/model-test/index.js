/*jshint node:true*/

module.exports = {
  description: 'Generates a model unit test.',
  
  locals: function(options) {
    var friendlyDescription = 'Unit | Models | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  },
};
