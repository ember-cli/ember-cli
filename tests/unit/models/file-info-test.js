'use strict';

var assert    = require('../../helpers/assert');
var MockUI    = require('../../helpers/mock-ui');
var FileInfo  = require('../../../lib/models/file-info');
var path      = require('path');
var fs        = require('fs');
var EOL       = require('os').EOL;
var Promise   = require('../../../lib/ext/promise');
var writeFile = Promise.denodeify(fs.writeFile);
var rimraf     = require('rimraf');
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var tmp        = require('tmp-sync');
var tmpdir;
var testOutputPath;

describe('Unit - FileInfo', function(){

  var validOptions, ui;

  beforeEach(function(){
    tmpdir = tmp.in(tmproot);
    testOutputPath = path.join(tmpdir, 'outputfile');

    ui = new MockUI();
    validOptions = {
      action: 'write',
      outputPath: testOutputPath,
      displayPath: '/pretty-output-path',
      inputPath: path.resolve(__dirname,
        '../../fixtures/blueprints/with-templating/files/foo.txt'),
      templateVariables: {},
      ui: ui
    };
  });

  afterEach(function(done){
    rimraf(tmproot, done);
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

  it('does not explode when trying to template binary files', function() {
    var binary = path.resolve(__dirname, '../../fixtures/problem-binary.png');

    validOptions.inputPath = binary;

    var fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output){
      assert(output,
        'expects the file to be processed without error');
    });
  });

  it('renders a diff to the UI', function(){
    validOptions.templateVariables.friend = 'Billy';
    var fileInfo = new FileInfo(validOptions);

    return writeFile(testOutputPath, 'Something Old' + EOL).then(function(){
      return fileInfo.displayDiff();
    }).then(function(){
      var output = ui.output.trim().split(EOL);
      assert.equal(output.shift(), 'Index: ' + testOutputPath);
      assert.match(output.shift(), /=+/);
      assert.match(output.shift(), /---/);
      assert.match(output.shift(), /\+{3}/);
      assert.match(output.shift(), /.*/);
      assert.match(output.shift(), /\+Howdy Billy/);
      assert.match(output.shift(), /-Something Old/);
    });
  });

  it('renders a menu with an overwrite option', function(){
    var fileInfo = new FileInfo(validOptions);

    setTimeout(function(){
      ui.inputStream.write('Y' + EOL);
    }, 10);

    return fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      assert.match(output.shift(), /Overwrite.*\?/);
      assert.equal(action, 'overwrite');
    });
  });

  it('renders a menu with an skip option', function(){
    var fileInfo = new FileInfo(validOptions);

    setTimeout(function(){
      ui.inputStream.write('n' + EOL);
    }, 10);

    return fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      assert.match(output.shift(), /Overwrite.*\?/);
      assert.equal(action, 'skip');
    });
  });

  it('renders a menu with an diff option', function(){
    var fileInfo = new FileInfo(validOptions);

    setTimeout(function(){
      ui.inputStream.write('d' + EOL);
    }, 10);

    return fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      assert.match(output.shift(), /Overwrite.*\?/);
      assert.equal(action, 'diff');
    });
  });

});
