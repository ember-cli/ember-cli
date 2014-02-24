var Promise = require('rsvp').Promise;

function _sequence(task, next) {
  var nextTask;

  return task().then(function(){
    if (nextTask = next()) {
      return _sequence(nextTask, next);
    }
  });
}

module.exports = function sequence(tasks) {
  function nextTask() {
    return tasks.shift();
  }

  if (tasks.length === 0) {
    return Promise.resolve();
  }

  return _sequence(nextTask(), nextTask);
};
