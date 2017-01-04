'use strict';

const fs = require('fs');
const a = require('./subfolder/a');
const b = require('./subfolder/b');

module.exports = function () {
  fs.writeFileSync('foo.txt', a() + ' ' + b());
};
