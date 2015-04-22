/*jshint node:true*/

module.exports = {
  description: 'Generates a mixin unit test.',

  locals: function(options) {
    var friendlyPrefix = 'Unit | Mixins |';
    return {
      friendlyPrefix: friendlyPrefix
    };
  }

};
