'use strict';

module.exports = function(iterator) {
  let nextItem;
  let results = [];

  nextItem = iterator.next();
  while (!nextItem.done) {
    results.push(nextItem.value);
    nextItem = iterator.next();
  }

  return results;
};
