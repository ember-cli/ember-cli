'use strict;'

var fs              = require('fs');
var path            = require('path');
var mkdirp          = require('mkdirp');
var Command         = require('../models/command');
var JsonGenerator   = require('../utilities/json-generator');

module.exports = Command.extend({
  name: 'update-package-cache',
  description: 'Generates a cache describing all commands and blueprints available for the command line',
  aliases: [],
  skipHelp: true,
  skipDependencyCheck: true,
  works: 'everywhere',

  availableOptions: [
    { name: 'silent', type: Boolean, default: true, aliases: ['s'] },
  ],

  anonymousOptions: [],

  cacheFileName: '.structure.json',

  run: function() {

    var json = this._getJson();
    var cache = JSON.stringify(json, function(key, value) {
      var path = require('path');
      // build command has a recursive property
      if (value === path) {
        return 'path';
      }
      return value;
    }, 2);

    this._cacheJson(cache);

    return cache;
  },

  _getJson: function() {
    var generator = new JsonGenerator({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks
    });

    return generator.generate({ json: true }, []);
  },

  _cacheJson: function(json) {

    var directoryPath = path.join(__dirname, '../..')
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
