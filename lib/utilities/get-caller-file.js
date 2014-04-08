// Inspired by http://stackoverflow.com/questions/13227489
// If you call this in a another function it returns you the file from
// which this function was called from. (Inspects the v8 stack trace)

module.exports = getCallerFile;
function getCallerFile() {
    var oldPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (err, stack) {return stack;};
    var stack = new Error().stack;
    Error.prepareStackTrace = oldPrepareStackTrace;
    return stack[2] ? stack[2].getFileName() : undefined;
}