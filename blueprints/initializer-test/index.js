/*jshint node:true*/

module.exports = {
  description: 'Generates an initializer unit test.',

  locals: function(options) {
    var friendlyPrefix = 'Unit | Initializers |';
    return {
      friendlyPrefix: friendlyPrefix
    };
  },
};
