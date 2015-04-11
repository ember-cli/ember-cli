/*jshint node:true*/

module.exports = {
  description: 'Generates a serializer unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Serializers | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
