'use strict';

/*
 * Turns out, YUIDoc attached a process.on('unhandledRejection' handler which
 * incorrectly reports any unhandledRejection as a YUIDoc error. This makes
 * debugging of unhandledRejections in the ember-cli test suite quite painful
 *
 * To address YUIDocs behavior, we run YUIDoc isolated in it's own process;
 */

if (!process.env['IS_CHILD']) {
  const { execa } = require('execa');

  describe('YUIDoc', function () {
    it('parses without warnings', async function () {
      await execa('node', [`--unhandled-rejections=strict`, __filename], {
        env: {
          IS_CHILD: true,
        },
      });
    });
  });
  return;
}

const Y = require('yuidocjs');
const EOL = require('os').EOL;

let options = Y.Project.init({
  quiet: true,
});
let yuiDoc = new Y.YUIDoc(options);

let json = yuiDoc.run();

let warnings = {};
json.warnings.forEach(function (warning) {
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
Object.keys(warnings).forEach(function (file) {
  message += `\t${file} – YUIDoc issues found:${EOL}${EOL}`;
  warnings[file].forEach(function (warning) {
    message += `\t\tline ${warning.line}: ${warning.message}${EOL}`;
  });
});

if (message.length) {
  throw new Error(message);
}
