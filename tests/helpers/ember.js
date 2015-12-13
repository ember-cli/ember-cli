'use strict';

var MockUI        = require('./mock-ui');
var MockAnalytics = require('./mock-analytics');
var cli           = require('../../lib/cli');

/*
  Accepts a single array argument, that contains the
  `process.argv` style arguments.

  Example:

  ```
  ember test --no-build --test-port=4567
  ```

  In this example, `process.argv` would be something similar to:

  ```
  ['path/to/node', 'path/to/bin/ember', 'test', '--no-build', '--test-port=4567']
  ```


  And this could be emulated by calling:

  ```
  ember(['test', '--no-build', '--test-port=4567']);
  ```

  ---

  The return value of this helper is a promise that resolves
  with an object that contains the following properties:

  * `exitCode` is the normal exit code in standard command invocation
  * `ui` is the `ui` object that was used for the invocation (which is
    a `MockUI` instance), this can be used to inspect the commands output.

*/
module.exports = function ember(args) {
  var cliInstance;

  args.push('--disable-analytics');
  args.push('--watcher=node');
  cliInstance = cli({
    inputStream:  [],
    outputStream: [],
    cliArgs:      args,
    Leek: MockAnalytics,
    UI: MockUI,
    testing: true
  });

  return cliInstance;
};
