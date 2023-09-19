'use strict';

const path = require('path');
const CommandGenerator = require('./command-generator');

let rootPath = process.cwd();

module.exports = function linkFixtureDependency(sourceDir) {
  const depPath = path.join(rootPath, 'tests', 'fixtures', sourceDir);
  let pnpm = new CommandGenerator('pnpm');
  pnpm.invoke('install', '--prefer-offline');
  pnpm.invoke('link', depPath);
};
