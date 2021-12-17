'use strict';

const chai = require('chai');
const chaiFiles = require('chai-files');
const chaiAsPromised = require('chai-as-promised');
const chaiJestSnapshot = require('chai-jest-snapshot');

chai.use(chaiFiles);
chai.use(chaiAsPromised);
chai.use(chaiJestSnapshot);

module.exports = chai;
module.exports.file = chaiFiles.file;
module.exports.dir = chaiFiles.dir;
