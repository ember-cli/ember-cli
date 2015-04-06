'use strict';

var expect    = require('chai').expect;
var MockUI    = require('../../helpers/mock-ui');
var FileInfo  = require('../../../lib/models/file-info');
var path      = require('path');
var fs        = require('fs-extra');
var EOL       = require('os').EOL;
var Promise   = require('../../../lib/ext/promise');
var writeFile = Promise.denodeify(fs.writeFile);
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var tmp        = require('tmp-sync');
var assign     = require('lodash/object/assign');
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
    fs.remove(tmproot, done);
  });

  it('can instantiate with options', function(){
    new FileInfo(validOptions);
  });

  it('renders an input file', function(){
    validOptions.templateVariables.friend = 'Billy';
    var fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output){
      expect(output.trim()).to.equal('Howdy Billy',
        'expects the template to have been run');
    });
  });

  it('falls back to raw text if template throws', function(){
    var templateWithUndefinedVariable = path.resolve(__dirname,
      '../../fixtures/blueprints/with-templating/files/with-undefined-variable.txt');
    var options = {};
    assign(options, validOptions, { inputPath: templateWithUndefinedVariable });
    var fileInfo = new FileInfo(options);

    return fileInfo.render().then(function(output){
      expect(output.trim()).to.equal('Howdy <%= enemy %>',
        'expects to fall back to raw text');
    });
  });

  it('does not explode when trying to template binary files', function() {
    var binary = path.resolve(__dirname, '../../fixtures/problem-binary.png');

    validOptions.inputPath = binary;

    var fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output){
      expect(!!output, 'expects the file to be processed without error').to.equal(true);
    });
  });

  it('renders a diff to the UI', function(){
    validOptions.templateVariables.friend = 'Billy';
    var fileInfo = new FileInfo(validOptions);

    return writeFile(testOutputPath, 'Something Old' + EOL).then(function(){
      return fileInfo.displayDiff();
    }).then(function(){
      var output = ui.output.trim().split(EOL);
      expect(output.shift()).to.equal('Index: ' + testOutputPath);
      expect(output.shift()).to.match(/=+/);
      expect(output.shift()).to.match(/---/);
      expect(output.shift()).to.match(/\+{3}/);
      expect(output.shift()).to.match(/.*/);
      expect(output.shift()).to.match(/\+Howdy Billy/);
      expect(output.shift()).to.match(/-Something Old/);
    });
  });

  it('renders a menu with an overwrite option', function(done){
    var fileInfo = new FileInfo(validOptions);

    ui.waitForPrompt().then(function(){
      ui.inputStream.write('Y' + EOL);
    });

    fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      expect(output.shift()).to.match(/Overwrite.*\?/);
      expect(action).to.equal('overwrite');
    });

    return done();
  });

  it('renders a menu with a skip option', function(done){
    var fileInfo = new FileInfo(validOptions);

    ui.waitForPrompt().then(function(){
      ui.inputStream.write('n' + EOL);
    });

    fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      expect(output.shift()).to.match(/Overwrite.*\?/);
      expect(action).to.equal('skip');
    });

    return done();
  });

  it('renders a menu with a diff option', function(done){
    var fileInfo = new FileInfo(validOptions);

    ui.waitForPrompt().then(function(){
      ui.inputStream.write('d' + EOL);
    });

    fileInfo.confirmOverwrite().then(function(action){
      var output = ui.output.trim().split(EOL);
      expect(output.shift()).to.match(/Overwrite.*\?/);
      expect(action).to.equal('diff');
    });

    return done();
  });

});
