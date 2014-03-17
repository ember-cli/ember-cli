'use strict';

var fs = require('fs-extra');
var mkdirSync = fs.mkdirSync;
var rimraf = require('rimraf');
var ember = require('../helpers/ember');

describe('Acceptance: ember new', function(){
  var root;
  beforeEach(function(){
    root = process.cwd();
    mkdirSync('tmp');
    process.chdir('./tmp');
  });

  afterEach(function(){
    process.chdir(root);
    rimraf.sync('tmp');
  });

  it('ember new foo, where foo does not yet exist, works', function() {
    this.timeout(1200000);
    return ember(['new', 'foo']);
  });

  it('ember new with empty app name doesnt throw exception', function() {
    return ember(['new', '']);
  });

  it('ember new without app name doesnt throw exception', function() {
    return ember(['new']);
  });

});
