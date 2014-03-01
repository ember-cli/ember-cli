var prompt = require('./prompt');

module.exports = function keypress(stdin) {
  return prompt('keypress').then(function (data) {
    return data.toString().trim();
  });
};
