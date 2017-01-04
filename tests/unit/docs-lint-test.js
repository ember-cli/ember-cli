'use strict';

const Y = require('yuidocjs');
const EOL = require('os').EOL;

describe('YUIDoc', function() {
  let options = Y.Project.init({
    quiet: true,
  });
  let yuiDoc = new Y.YUIDoc(options);

  let json = yuiDoc.run();

  let warnings = {};
  json.warnings.forEach(function(warning) {
    let tmp = warning.line.split(':');
    let file = tmp[0].trim();
    let line = tmp[1];

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
      let fileWarnings = warnings[file];
      if (fileWarnings) {
        let message = `YUIDoc issues found:${EOL}${EOL}`;
        fileWarnings.forEach(function(warning) {
          message += `line ${warning.line}: ${warning.message}${EOL}`;
        });

        let error = new Error(message);
        delete error.stack;
        throw error;
      }
    });
  });
});
