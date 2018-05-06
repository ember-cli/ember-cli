'use strict';

const { Promise } = require('rsvp');
/*
 *
 * given an array of functions, that may or may not return promises sequence
 * will invoke them sequentially. If a promise is encountered sequence will
 * wait until it fulfills before moving to the next entry.
 *
 * ```js
 * var tasks = [
 *   function() { return Promise.resolve(1); },
 *   2,
 *   function() { return timeout(1000).then(function() { return 3; } },
 * ];
 *
 * sequence(tasks).then(function(results) {
 *   results === [
 *     1,
 *     2,
 *     3
 *   ]
 * });
 * ```
 *
 * @method sequence
 * @param tasks
 * @return Promise<Array>
 *
 */
module.exports = function sequence(tasks) {
  let current = Promise.resolve();
  let results = new Array(tasks.length);

  for (let i = 0; i < tasks.length; ++i) {
    current = results[i] = current.then(tasks[i]);
  }

  return Promise.all(results);
};
