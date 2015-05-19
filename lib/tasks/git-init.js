'use strict';

var Promise  = require('../../lib/ext/promise');
var Task     = require('../models/task');
var exec     = Promise.denodeify(require('child_process').exec);
var path     = require('path');
var pkg      = require('../../package.json');
var fs       = require('fs');
var template = require('lodash/string/template');

module.exports = Task.extend({
  run: function(commandOptions) {
    var chalk  = require('chalk');
    var ui     = this.ui;

    if(commandOptions.skipGit) { return Promise.resolve(); }

    return exec('git --version')
      .then(function() {
        return exec('git init')
          .then(function() {
          return exec('git add .');
        })
        .then(function(){
          return exec('git commit -m "Initial commit"');
        })
        .then(function(){
          ui.writeLine(chalk.green('Successfully initialized git.'));
        });
      }).catch(function(/*error*/){
        // if git is not found or an error was thrown during the `git`
        // init process just swallow any errors here
    });
  }
});
