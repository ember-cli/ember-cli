'use strict';

const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const gzip = util.promisify(zlib.gzip);

module.exports = async function (file) {
  let contentsBuffer = fs.readFileSync(file);
  return gzip(contentsBuffer).then((buffer) => ({
    name: file,
    size: contentsBuffer.length,
    gzipSize: buffer.length,
    showGzipped: contentsBuffer.length > 0,
  }));
};
