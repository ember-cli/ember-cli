'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  run: function(options) {
    var testemOptions = { file: options.configFile };
    var mode = 'startCI';
    var testem  = new Testem();

    testem[mode](testemOptions);

    return Promise.resolve();
  }
});
