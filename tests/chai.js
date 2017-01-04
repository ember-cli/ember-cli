'use strict';

let chai = require('chai');
let chaiFiles = require('chai-files');
let chaiAsPromised = require('chai-as-promised');

chai.use(chaiFiles);
chai.use(chaiAsPromised);

module.exports = chai;
module.exports.file = chaiFiles.file;
module.exports.dir = chaiFiles.dir;
