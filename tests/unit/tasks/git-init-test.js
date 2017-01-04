'use strict';

var fs = require('fs-extra');
var expect = require('chai').expect;
var MockUI = require('console-ui/mock');
var GitInitTask = require('../../../lib/tasks/git-init');
var MockProject = require('../../helpers/mock-project');
var Promise = require('../../../lib/ext/promise');
var remove = Promise.denodeify(fs.remove);
var path = require('path');
var root = process.cwd();
var mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
var tmproot = path.join(root, 'tmp');
var td = require('testdouble');

describe('git-init', function() {
  var subject, ui, tmpdir, exec;

  beforeEach(function() {
    exec = td.function('exec');

    return mkTmpDirIn(tmproot).then(function(dir) {
      tmpdir = dir;
      ui = new MockUI();
      subject = new GitInitTask({
        ui,
        project: new MockProject(),
        exec,
      });
      process.chdir(tmpdir);
    });

  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  describe('skipGit: true', function() {
    it('does not initialize git', function() {
      td.when(exec()).thenResolve();

      return subject.run({
        skipGit: true,
      }).then(function() {
        expect(ui.output).to.not.include('Successfully initialized git.');
        td.verify(exec('git --version'), { times: 0 });
      });
    });
  });

  it('correctly initializes git if git is around, and more or less works', function() {
    td.when(exec(td.matchers.contains('git --version'))).thenResolve();
    td.when(exec(td.matchers.contains('git init'))).thenResolve();
    td.when(exec(td.matchers.contains('git add .'))).thenResolve();
    td.when(exec(td.matchers.contains('git commit -m'))).thenResolve();

    return subject.run().then(function() {
      td.verify(exec(td.matchers.contains('git --version')));
      td.verify(exec(td.matchers.contains('git init')));
      td.verify(exec(td.matchers.contains('git add .')));
      td.verify(exec(td.matchers.contains('git commit -m "'), td.matchers.anything()));

      expect(ui.output).to.contain('Successfully initialized git.');
      expect(ui.errors).to.equal('');
    });
  });


  it('skips initializing git, if `git --version` fails', function() {
    td.when(exec(td.matchers.contains('git --version'))).thenReject();

    return subject.run().then(function() {
      td.verify(exec(td.matchers.contains('git --version')), { times: 1 });
      td.verify(exec(td.matchers.contains('git init')), { times: 0 });
      td.verify(exec(td.matchers.contains('git add .')), { times: 0 });
      td.verify(exec(td.matchers.contains('git commit -m "'), td.matchers.anything()), { times: 0 });

      expect(ui.output).to.contain('');
      expect(ui.errors).to.equal('');
    });
  });
});
