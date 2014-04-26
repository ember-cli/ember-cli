'use strict';

var assert   = require('../../helpers/assert'),
    MockUI   = require('../../helpers/mock-ui'),
    FileInfo = require('../../../lib/models/file-info'),
    path     = require('path');

describe('Unit - FileInfo', function(){

  var validOptions, ui;

  before(function(){
    ui = new MockUI();
    validOptions = {
      action: 'write',
      outputPath: '/tmp/file-into-test-output',
      displayPath: '/pretty-output-path',
      inputPath: path.resolve(__dirname,
        '../../fixtures/blueprints/with-templating/foo.txt'),
      templateVariables: {},
      ui: ui
    };
  });

  it('can instantiate with options', function(){
    new FileInfo(validOptions);
  });

  it('renders an input file', function(){
    validOptions.templateVariables.friend = 'Billy';
    var fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output){
      assert.equal(output.trim(), 'Howdy Billy',
        'expects the template to have been run');
    });
  });

});
