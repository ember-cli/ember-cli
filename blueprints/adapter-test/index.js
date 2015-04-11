/*jshint node:true*/

module.exports = {
  description: 'Generates an ember-data adapter unit test',

  locals: function(options) {
    var friendlyDescription = 'Unit | Adapters | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
    };
  }
};
