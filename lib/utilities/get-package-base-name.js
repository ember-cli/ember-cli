'use strict';

var npa = require('npm-package-arg');


module.exports = function (name) {
  var parsed, parsedName

  if (!name) {
    return null;
  }

  parsed = npa(name);
  parsedName = parsed.name;

  if (parsed.scope) {
    parsedName = parsedName.replace(parsed.scope, '').slice(1);
  }

  return parsedName;
};
