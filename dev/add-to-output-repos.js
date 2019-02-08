#!/usr/bin/env node
'use strict';

const co = require('co');
const addToOutputRepo = require('./add-to-output-repo');

const stableBranch = 'stable';
const betaBranch = 'master';

let branch = process.argv[2] === 'beta' ? betaBranch : stableBranch;
let fork = process.argv[3] === 'fork' ? stableBranch : '';

co(function *() {
  yield addToOutputRepo({ command: 'new', branch, fork });
  yield addToOutputRepo({ command: 'addon', branch, fork });
});
