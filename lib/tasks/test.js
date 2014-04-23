'use strict';

var assign  = require('lodash-node/modern/objects/assign');
var fs      = require('fs');
var Task    = require('../task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = new Task({
  run: function(environment, options) {
    var json = JSON.parse(
        fs.readFileSync(options.configFile, 'utf-8').replace(/\n/,'')
      );
    var testemOptions = assign({}, json, { cwd: options.cwd });
    var mode = 'startCI';
    var testem  = new Testem();

    testem[mode](testemOptions);

    return Promise.resolve();
  }
});
