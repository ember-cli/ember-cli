'use strict';

var prompt = require('./prompt');

module.exports = function keypress() {
  return prompt('keypress').then(function (data) {
    return data.toString().trim();
  });
};
