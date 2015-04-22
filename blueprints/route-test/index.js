/*jshint node:true*/

module.exports = {
  description: 'Generates a route unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Routes | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
