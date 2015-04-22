/*jshint node:true*/

module.exports = {
  description: 'Generates a view unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Views | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
