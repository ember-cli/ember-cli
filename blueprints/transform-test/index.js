/*jshint node:true*/

module.exports = {
  description: 'Generates a transform unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Transforms | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
