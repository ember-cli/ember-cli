'use strict';

var fs = require('fs');
var logo = fs.readFileSync(__dirname + '/logo.txt', 'utf8');

function banner () {
  var len = Math.min(process.stdout.columns - 1, 140) * 12;
  return logo.split('\n').map(trim).join('\n');

  function trim (line) {
    return line.substr(0, len) + line.substr(-5);
  }
}

module.exports = banner;
