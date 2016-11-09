'use strict';

var Command = require('../models/command');

/*
  Note: This class is for INTERNAL use only. If you're looking at the code
  for examples, `models/command.js` file is a good place to start.

  Represents an internal ember-cli command.

  It adds `isInternal` flag which is used by internal analytics
  to report timings/usage.
*/
module.exports = Command.extend({
  isInternal: true
});
