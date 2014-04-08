// From http://stackoverflow.com/questions/13227489

module.exports = getCallerFile;
function getCallerFile() {
    try {
        var err = new Error(),callerfile,currentfile;
        Error.prepareStackTrace = function (err, stack) {return stack;};
        currentfile=err.stack.shift().getFileName();
        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();
            if(currentfile!==callerfile) return callerfile;
        }
    } catch (err) {}
    return undefined;
}
