'use strict';

var fs          = require('fs-extra');
var expect      = require('chai').expect;
var MockUI      = require('../../helpers/mock-ui');
var GitInitTask = require('../../../lib/tasks/git-init');
var MockProject = require('../../helpers/mock-project');
var Promise     = require('../../../lib/ext/promise');
var remove      = Promise.denodeify(fs.remove);
var path        = require('path');
var root        = process.cwd();
var tmp         = require('tmp-sync');
var tmproot     = path.join(root, 'tmp');

describe('git-init', function() {
  var subject, ui;
  var tmpdir;

  beforeEach(function() {
    tmpdir  = tmp.in(tmproot);
    ui      = new MockUI();
    subject = new GitInitTask({
      ui: ui,
      project: new MockProject()
    });
    process.chdir(tmpdir);
  });
  
  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });
  
/** 
* TODO: git commit not working with this test setup, it errors out.
* We need to be able to
*/  
  it('skipGit properly skips git-init', function() {
    return subject.run({skipGit:true}).then(function() {
      expect(ui.output).to.not.include('Successfully initialized git.');
    });
  });
  
  it('errors are logged with logErrors', function() {
    return subject.run({skipGit: false, logErrors: true}).then(function() {
      expect(ui.output).to.equal('');
      expect(ui.errors).to.not.equal('');
    });
  });
});
