/*jshint node:true*/

module.exports = {
  description: 'Generates a util unit test.',

  locals: function(options) {
    var friendlyPrefix = 'Unit | Utils |';
    return {
      friendlyPrefix: friendlyPrefix
    };
  }
};
