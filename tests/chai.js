'use strict';

var chai = require('chai');
var chaiFiles = require('chai-files');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiFiles);
chai.use(chaiAsPromised);

module.exports = chai;
module.exports.file = chaiFiles.file;
module.exports.dir = chaiFiles.dir;
