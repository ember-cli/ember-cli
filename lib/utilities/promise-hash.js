'use strict';

module.exports = async function hash(object) {
  const keys = Object.keys(object);
  const values = new Array(keys.length);
  for (let i = 0; i < keys.length; i++) {
    values[i] = object[keys[i]];
  }
  const resolvedValues = await Promise.all(values);
  const result = {};
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = resolvedValues[i];
  }
  return result;
};
