var fs              = require('fs');
var mkdirp          = require('mkdirp');
var Command         = require('../models/command');
var JsonGenerator   = require('../utilities/json-generator');

module.exports = Command.extend({
  name: 'generate-json',
  description: 'Generates a cache describing all commands and blueprints available for the command line',
  aliases: [],
  skipHelp: true,
  works: 'everywhere',

  availableOptions: [
    { name: 'silent', type: Boolean, default: true, aliases: ['s'] },
  ],

  anonymousOptions: [],

  cacheDirectory: '/node_modules/ember-cli',
  cacheFileName: 'commands-help.json',

  run: function(commandOptions, rawArgs) {

    var json = this._getJson(commandOptions, rawArgs);
    var cache = JSON.stringify(json, function(key, value) {
      var path = require('path');
      // build command has a recursive property
      if (value === path) {
        return 'path';
      }
      return value;
    }, 2);

    if (rawArgs.length === 0) {
      this._cacheJson(cache);
      this.ui.writeLine('\n\nwriting to cache\n\n');
    }

    return cache;
  },

  _getJson: function(commandOptions, rawArgs) {
    var generator = new JsonGenerator({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks
    });

    return generator.generate(commandOptions, rawArgs);
  },

  _cacheJson: function(json) {

    var directoryPath = this.project.root + this.cacheDirectory;
    var cachePath = directoryPath + '/' + this.cacheFileName;

    this._openOrCreateCache(directoryPath, this.cacheFileName);
    fs.writeFileSync(cachePath, json);

  },

  _openOrCreateCache: function(directoryPath, fileName) {

    var cachePath = directoryPath + '/' + fileName;

    if (!fs.exists(cachePath)) {
      mkdirp.sync(directoryPath);
      fs.openSync(cachePath, 'w+');
    }

  }

});
