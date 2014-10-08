'use strict';

var DocGenerator = require('../../../lib/utilities/doc-generator.js');
var calculateVersion = require('../../../lib/utilities/ember-cli-version.js');
var assert = require('assert');

describe('generateDocs', function(){
  it('calls the the appropriate command', function(){
    var execFunc = function() {
      var pattern = 'cd docs && .+/node_modules/yuidocjs/lib/cli.js -q --project-version ' + escapeRegExp(calculateVersion());
      assert.ok((new RegExp(pattern)).test(arguments[0]));
    };

    var generator = new DocGenerator({exec: execFunc});
    generator.generate();
  });
});

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
