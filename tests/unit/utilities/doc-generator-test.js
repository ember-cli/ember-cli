'use strict';

var DocGenerator = require('../../../lib/utilities/doc-generator.js');
var versionUtils = require('../../../lib/utilities/version-utils');
var calculateVersion = versionUtils.emberCLIVersion;
var expect = require('chai').expect;
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

      expect((new RegExp(pattern)).test(arguments[0])).to.equal(true);
    };

    var generator = new DocGenerator({exec: execFunc});
    generator.generate();
  });
});

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
