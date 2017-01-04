'use strict';

const fs = require('fs');
const a = require('./subfolder/a');

module.exports = function () {
  fs.writeFileSync('foo.txt', a());
};
