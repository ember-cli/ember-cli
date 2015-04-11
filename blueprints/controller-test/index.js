/*jshint node:true*/

module.exports = {
  description: 'Generates a controller unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Controllers | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
