'use strict';

module.exports = function getCallerFile(position) {
  if (position === undefined) {
    position = 2;
  }
  if (position >= Error.stackTraceLimit) {
    throw new TypeError(
      `getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: \`${position}\` and Error.stackTraceLimit was: \`${Error.stackTraceLimit}\``
    );
  }
  let oldPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };
  let stack = new Error().stack;
  Error.prepareStackTrace = oldPrepareStackTrace;
  if (stack !== null && typeof stack === 'object') {
    return stack[position] ? stack[position].getFileName() : undefined;
  }
};
