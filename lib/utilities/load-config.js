'use strict';

var findup = require('find-up');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var parsers = {
  '.yml': yaml.safeLoad,
  '.yaml': yaml.safeLoad,
  '.json': JSON.parse
};

function loadConfig(file, basedir) {
  basedir = basedir || __dirname;
  var ext = path.extname(file);
  var configPath = findup.sync(file, { cwd: basedir });

  var content;
  try {
    content = fs.readFileSync(configPath, 'utf8');
    if (parsers[ext]) {
      content = parsers[ext](content);
    }
  } catch (e) {
    // ESLint doesn't like this.
  }

  return content;
}

module.exports = loadConfig;
