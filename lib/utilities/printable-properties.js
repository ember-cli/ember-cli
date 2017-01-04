'use strict';

let commandProperties = [
  'name',
  'description',
  'aliases',
  'works',
  'availableOptions',
  'anonymousOptions',
];
let blueprintProperties = [
  'name',
  'description',
  'availableOptions',
  'anonymousOptions',
  'overridden',
];

function forEachWithProperty(properties, forEach, context) {
  return properties.filter(function(key) {
    return this[key] !== undefined;
  }, context).forEach(forEach, context);
}

module.exports = {
  command: {
    forEachWithProperty(forEach, context) {
      return forEachWithProperty(commandProperties, forEach, context);
    },
  },
  blueprint: {
    forEachWithProperty(forEach, context) {
      return forEachWithProperty(blueprintProperties, forEach, context);
    },
  },
};
