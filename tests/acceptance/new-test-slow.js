'use strict';

const tmp = require('tmp-promise');
const execa = require('execa');
const { join } = require('node:path');
const ember = require('../helpers/ember');

const root = process.cwd();
let tmpDir;

describe('Acceptance: ember new | ember addon', function () {
  this.timeout(500000);

  beforeEach(async function () {
    const { path } = await tmp.dir();
    tmpDir = path;
    process.chdir(path);
  });

  afterEach(function () {
    process.chdir(root);
  });

  for (const packageManager of ['npm', 'pnpm', 'yarn']) {
    describe(packageManager, function () {
      describe('ember new', function () {
        it('generates a new app with no linting errors', async function () {
          await ember(['new', 'foo-app', `--${packageManager}`]);
          await execa(packageManager, ['run', 'lint'], { cwd: join(tmpDir, 'foo-app') });
        });

        it('generates a new TS app with no linting errors', async function () {
          await ember(['new', 'foo-app', `--${packageManager}`, '--typescript']);
          await execa(packageManager, ['run', 'lint'], { cwd: join(tmpDir, 'foo-app') });
        });
      });

      describe('ember addon', function () {
        it('generates a new addon with no linting errors', async function () {
          await ember(['addon', 'foo-addon', `--${packageManager}`]);
          await execa(packageManager, ['run', 'lint'], { cwd: join(tmpDir, 'foo-addon') });
        });

        it('generates a new TS addon with no linting errors', async function () {
          await ember(['addon', 'foo-addon', `--${packageManager}`, '--typescript']);
          await execa(packageManager, ['run', 'lint'], { cwd: join(tmpDir, 'foo-addon') });
        });
      });
    });
  }
});
