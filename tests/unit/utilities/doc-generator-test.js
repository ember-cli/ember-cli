'use strict';

var DocGenerator = require('../../../lib/utilities/doc-generator.js');
var calculateVersion = require('../../../lib/utilities/ember-cli-version.js');
var assert = require('assert');
var path = require('path');

describe('generateDocs', function(){
  it('calls the the appropriate command', function(){
    var execFunc = function() {
      var commandPath = '/node_modules/yuidocjs/lib/cli.js';
      if (process.platform === 'win32') {
        commandPath = escapeRegExp(path.normalize('/node_modules/.bin/yuidoc'));
      }
      var pattern = 'cd docs && .+' + commandPath + ' -q --project-version ' + escapeRegExp(calculateVersion());
      console.log('Pattern:  ' + pattern);
      console.log('Argument: ' + arguments[0]);

      assert.ok((new RegExp(pattern)).test(arguments[0]));
    };

    var generator = new DocGenerator({exec: execFunc});
    generator.generate();
  });
});

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
