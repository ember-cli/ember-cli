'use strict';

var Y = require('yuidocjs');
var EOL = require('os').EOL;

describe('YUIDoc', function() {
  var options = Y.Project.init({
    quiet: true,
  });
  var yuiDoc = new Y.YUIDoc(options);

  var json = yuiDoc.run();

  var warnings = {};
  json.warnings.forEach(function(warning) {
    var tmp = warning.line.split(':');
    var file = tmp[0].trim();
    var line = tmp[1];

    if (!warnings[file]) {
      warnings[file] = [];
    }

    warnings[file].push({
      line,
      message: warning.message,
    });
  });

  Object.keys(json.files).forEach(function(file) {
    it(file, function() {
      var fileWarnings = warnings[file];
      if (fileWarnings) {
        var message = `YUIDoc issues found:${EOL}${EOL}`;
        fileWarnings.forEach(function(warning) {
          message += `line ${warning.line}: ${warning.message}${EOL}`;
        });

        var error = new Error(message);
        delete error.stack;
        throw error;
      }
    });
  });
});
