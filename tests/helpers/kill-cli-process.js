'use strict';

module.exports = function(childProcess) {
  // Calling `.kill` or `.send` when the process has already exited causes
  // errors on Windows, when an `.exitCode` is non-null the process has exited
  if (childProcess.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    childProcess.send({ kill: true });
  } else {
    childProcess.kill('SIGINT');
  }
};
