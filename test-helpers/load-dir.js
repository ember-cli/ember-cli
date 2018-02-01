'use strict';

const fixturify = require('fixturify');

// borrowed from https://gist.github.com/ivan-kleshnin/301a7e96be6c8725567f6832a49042df
const isPlainObject = o => Object.prototype.toString.call(o) === '[object Object]';

const flattenObject = (obj, delimiter, keys) => {
  delimiter = delimiter || '.';
  keys = keys || [];
  return Object.keys(obj).reduce((acc, key) =>
    Object.assign(acc, isPlainObject(obj[key])
      ? flattenObject(obj[key], delimiter, keys.concat(key))
      : { [keys.concat(key).join(delimiter)]: obj[key] }
    ),
  {});
};

module.exports = function loadDir(path) {
  return flattenObject(fixturify.readSync(path), '/');
};
