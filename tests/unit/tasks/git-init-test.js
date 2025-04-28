'use strict';

const { expect } = require('chai');
const MockUI = require('console-ui/mock');
const GitInitTask = require('../../../lib/tasks/git-init');
const MockProject = require('../../helpers/mock-project');
let root = process.cwd();
const td = require('testdouble');
const tmp = require('tmp-promise');

describe('git-init', function () {
  let task;

  beforeEach(async function () {
    task = new GitInitTask({
      ui: new MockUI(),
      project: new MockProject(),
      _gitVersion: td.function(),
      _gitInit: td.function(),
      _gitAdd: td.function(),
      _gitCommit: td.function(),
    });

    const { path } = await tmp.dir();
    process.chdir(path);
  });

  afterEach(async function () {
    process.chdir(root);
  });

  describe('skipGit: true', function () {
    it('does not initialize git', async function () {
      await task.run({
        skipGit: true,
      });
      expect(task.ui.output).to.not.include('Git:.');
      td.verify(task._gitVersion(), { times: 0 });
    });
  });

  it('correctly initializes git if git is around, and more or less works', async function () {
    td.when(task._gitVersion()).thenResolve();
    td.when(task._gitInit()).thenResolve();
    td.when(task._gitAdd()).thenResolve();
    td.when(task._gitCommit()).thenResolve();

    await task.run();
    td.verify(task._gitVersion());
    td.verify(task._gitInit());
    td.verify(task._gitAdd());
    td.verify(task._gitCommit());

    expect(task.ui.output).to.contain('Git: successfully initialized.');
    expect(task.ui.errors).to.equal('');
  });

  it('skips initializing git, if `git --version` fails', async function () {
    td.when(task._gitVersion()).thenReject();

    await task.run();
    td.verify(task._gitInit(), { times: 0 });
    td.verify(task._gitAdd(), { times: 0 });
    td.verify(task._gitCommit(td.matchers.anything()), { times: 0 });

    expect(task.ui.output).to.contain('');
    expect(task.ui.errors).to.equal('');
  });

  it('includes the HOME environment variable in the environment passed to git', function () {
    let env = task.buildGitEnvironment();
    expect(env.HOME).to.equal(process.env.HOME);
  });
});
