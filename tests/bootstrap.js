'use strict';

const chai = require('chai');
const Mocha = require('mocha');

const chaiAsPromised = require('chai-as-promised');
const chaiFiles = require('chai-files');
const chaiJestSnapshot = require('chai-jest-snapshot');

chai.use(chaiFiles);
chai.use(chaiAsPromised);
chai.use(chaiJestSnapshot);

module.exports = { chai };
