'use strict';

var MockUI        = require('./mock-ui');
var MockAnalytics = require('./mock-analytics');
var Cli           = require('../../lib/cli');
var path          = require('path');

module.exports = function ember(args, projectType) {
  var cli;
  var type = projectType || 'app';
  args.push('--disable-analytics');
  args.push('--watcher=node');
  args.push('--skipGit');
  cli = new Cli({
    inputStream:  [],
    outputStream: [],
    cliArgs:      args,
    Leek: MockAnalytics,
    UI: MockUI,
    testing: true,
    cli: {
      // This prevents ember-cli from detecting any other package.json files
      // forcing ember-cli to act as the globally installed package
      npmPackage: 'ember-cli',
      root: path.resolve(__dirname, '..', 'fixtures', type, 'package')
    }
  });

  return cli;
};
