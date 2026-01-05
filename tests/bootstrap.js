'use strict';

const { use } = require('chai');

const { default: chaiAsPromised } = require('chai-as-promised');
const chaiFiles = require('chai-files');
const chaiJestSnapshot = require('chai-jest-snapshot');

use(chaiFiles);
use(chaiAsPromised);
use(chaiJestSnapshot);
