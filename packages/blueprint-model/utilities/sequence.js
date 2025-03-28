'use strict';

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
module.exports = async function sequence(tasks) {
  let length = tasks.length;
  let results = [];

  for (let i = 0; i < length; ++i) {
    let task = tasks[i];
    let prevResult = results[i - 1];

    results.push(typeof task === 'function' ? await task(prevResult) : await task);
  }

  return results;
};
