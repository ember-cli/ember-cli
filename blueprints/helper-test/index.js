/*jshint node:true*/

module.exports = {
  description: 'Generates a helper unit test.',

  locals: function(options) {
    var friendlyPrefix = 'Unit | Helpers |';
    return {
      friendlyPrefix: friendlyPrefix
    };
  },
};
