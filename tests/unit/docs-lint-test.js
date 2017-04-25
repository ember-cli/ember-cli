'use strict';

const Y = require('yuidocjs');
const EOL = require('os').EOL;

describe('YUIDoc', function() {
  let options = Y.Project.init({
    quiet: true,
  });
  let yuiDoc = new Y.YUIDoc(options);

  it('parses without warnings', function() {
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

    let message = '';
    Object.keys(warnings).forEach(function(file) {
      message += `\t${file} – YUIDoc issues found:${EOL}${EOL}`;
      warnings[file].forEach(function(warning) {
        message += `\t\tline ${warning.line}: ${warning.message}${EOL}`;
      });
    });

    if (message.length) {
      let error = new Error(message);
      delete error.stack;
      throw error;
    }
  });
});
