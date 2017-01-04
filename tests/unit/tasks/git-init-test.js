'use strict';

const fs = require('fs-extra');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const GitInitTask = require('../../../lib/tasks/git-init');
const MockProject = require('../../helpers/mock-project');
const Promise = require('../../../lib/ext/promise');
let remove = Promise.denodeify(fs.remove);
const path = require('path');
let root = process.cwd();
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
let tmproot = path.join(root, 'tmp');
const td = require('testdouble');

describe('git-init', function() {
  let subject, ui, tmpdir, exec;

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
