/*jshint node:true*/

module.exports = {
  description: 'Generates a service unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Services | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
