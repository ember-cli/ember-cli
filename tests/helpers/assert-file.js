'use strict';

var expect   = require('chai').expect;
var contains = require('lodash-node/compat/collections/contains');
var flatten  = require('lodash-node/compat/arrays/flatten');
var fs       = require('fs-extra');
var path     = require('path');
var EOL      = require('os').EOL;

/*
  Asserts that a given file exists.

  ```js
  assertFile('some/file.js');
  ```

  You can also make assertions about the file’s contents using
  `contains` and `doesNotContain`:

  ```js
  assertFile('some/file.js', {
    contains: [
      'foo',
      /[0-9]+/
    ],
    doesNotContain: 'bar'
  });
  ```

  @method assertFile
  @param {String} file
  @param {Object} options
         Optional extra assertions to perform on the file.
  @param {String, Array} options.contains
         Strings or regular expressions the file must contain.
  @param {String, Array} options.doesNotContain
         Strings or regular expressions the file must *not* contain.
*/
module.exports = function assertFile(file, options) {
  var filePath = path.join(process.cwd(), file);

  expect(fs.existsSync(filePath)).to.equal(true, 'expected ' + file + ' to exist');

  if (!options) {
    return;
  }

  var actual = fs.readFileSync(filePath, { encoding: 'utf-8' });

  if (options.contains) {
    flatten([options.contains]).forEach(function(expected) {
      var pass;

      if (expected.test) {
        pass = expected.test(actual);
      } else {
        pass = contains(actual, expected);
      }

      expect(pass).to.equal(true, EOL + EOL + 'expected ' + file + ':' + EOL + EOL +
                                  actual +
                                  EOL + 'to contain:' + EOL + EOL +
                                  expected + EOL);
    });
  }

  if (options.doesNotContain) {
    flatten([options.doesNotContain]).forEach(function(unexpected) {
      var pass;

      if (unexpected.test) {
        pass = !unexpected.test(actual);
      } else {
        pass = !contains(actual, unexpected);
      }

      expect(pass).to.equal(true, EOL + EOL + 'expected ' + file + ':' + EOL + EOL +
                                  actual + EOL +
                                  'not to contain:' + EOL + EOL +
                                  unexpected + EOL);
    });
  }
};
