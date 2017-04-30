'use strict';

const fs = require('fs-extra');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const GitInitTask = require('../../../lib/tasks/git-init');
const MockProject = require('../../helpers/mock-project');
const RSVP = require('rsvp');
const path = require('path');
let root = process.cwd();
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
let tmproot = path.join(root, 'tmp');
const td = require('testdouble');

const remove = RSVP.denodeify(fs.remove);

describe('git-init', function() {
  let task;

  beforeEach(function() {
    task = new GitInitTask({
      ui: new MockUI(),
      project: new MockProject(),
      _gitVersion: td.function(),
      _gitInit: td.function(),
      _gitAdd: td.function(),
      _gitCommit: td.function(),
    });

    return mkTmpDirIn(tmproot).then(function(tmpdir) {
      process.chdir(tmpdir);
    });
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  describe('skipGit: true', function() {
    it('does not initialize git', function() {
      return task.run({
        skipGit: true,
      }).then(function() {
        expect(task.ui.output).to.not.include('Successfully initialized git.');
        td.verify(task._gitVersion(), { times: 0 });
      });
    });
  });

  it('correctly initializes git if git is around, and more or less works', function() {
    td.when(task._gitVersion()).thenResolve();
    td.when(task._gitInit()).thenResolve();
    td.when(task._gitAdd()).thenResolve();
    td.when(task._gitCommit()).thenResolve();

    return task.run().then(function() {
      td.verify(task._gitVersion());
      td.verify(task._gitInit());
      td.verify(task._gitAdd());
      td.verify(task._gitCommit());

      expect(task.ui.output).to.contain('Successfully initialized git.');
      expect(task.ui.errors).to.equal('');
    });
  });


  it('skips initializing git, if `git --version` fails', function() {
    td.when(task._gitVersion()).thenReject();

    return task.run().then(function() {
      td.verify(task._gitVersion(), { times: 1 });
      td.verify(task._gitInit(), { times: 0 });
      td.verify(task._gitAdd(), { times: 0 });
      td.verify(task._gitCommit(td.matchers.anything()), { times: 0 });

      expect(task.ui.output).to.contain('');
      expect(task.ui.errors).to.equal('');
    });
  });

  it('includes the HOME environment variable in the environment passed to git', function() {
    let env = task.buildGitEnvironment();
    expect(env.HOME).to.equal(process.env.HOME);
  });

});
