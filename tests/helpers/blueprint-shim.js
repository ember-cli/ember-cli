var fs = require('fs-extra');
var path = require('path');

var stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');
var transformer = require('../../blueprints/addon/index');

var versionUtils = require('../../lib/utilities/version-utils');
var processTemplate = require('../../lib/utilities/process-template');

// The blueprint paths for `bower.json` and `package.json` so we're using the right things.
var paths = {
  'bower.json': path.join(__dirname, '..', '..', 'blueprints', 'app', 'files', 'bower.json'),
  'package.json': path.join(__dirname, '..', '..', 'blueprints', 'app', 'files', 'package.json')
};

// The addon `bower.json` and `package.json` are defined as transforms of the app versions.

// 1. Get contents for processing.
var contents = {
  app: {
    'bower.json': fs.readFileSync(paths['bower.json'], 'utf8'),
    'package.json': fs.readFileSync(paths['package.json'], 'utf8')
  },
  addon: {
    'bower.json': '',
    'package.json': ''
  }
};

// 2. Stub out the shape of `this` expected by the transforms in the addon blueprint.
var BlueprintShim = {
  _readContentsFromFile: function(filename) {
    return fs.readJsonSync(paths[filename]);
  },
  _writeContentsToFile: function(value, filename) {
    contents.addon[filename] = stringifyAndNormalize(value);
  },
  description: '',
  project: {
    name: function() {
      return JSON.parse(contents['app']['bower.json']).name;
    }
  }
};

transformer.generateBowerJson.call(BlueprintShim);
transformer.generatePackageJson.call(BlueprintShim);

// We'll use the same template patterns we use in blueprints to guarantee correctness.
var context = {
  name: 'global',
  emberCLIVersion: '*'
};

contents['app']['bower.json'] = processTemplate(contents['app']['bower.json'], context);
contents['app']['package.json'] = processTemplate(contents['app']['package.json'], context);
contents['addon']['bower.json'] = processTemplate(contents['addon']['bower.json'], context);
contents['addon']['package.json'] = processTemplate(contents['addon']['package.json'], context);

module.exports = contents;
