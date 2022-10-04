'use strict';

const fs = require('fs');
const zlib = require('zlib');

module.exports = function (file) {
  let contentsBuffer = fs.readFileSync(file);

  return {
    brotliSize: zlib.brotliCompressSync(contentsBuffer).length,
    gzipSize: zlib.gzipSync(contentsBuffer).length,
    name: file,
    size: contentsBuffer.length,
  };
};
