'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  run: function(options) {
    var testemOptions = { file: options.configFile, cwd: 'tmp/output'};
    var testem  = new Testem();

    testem.startCI(testemOptions);

    return Promise.resolve();
  }
});
