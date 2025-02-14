'use strict';

const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
const execa = require('execa');
const { join } = require('node:path');
const { chdir, cwd } = require('node:process');
const ember = require('../helpers/ember');

const tmpDir = join(cwd(), 'tmp/new-test-slow');

describe('Acceptance: ember new | ember addon', function () {
  this.timeout(500000);

  beforeEach(async function () {
    await tmp.setup(tmpDir);
    chdir(tmpDir);
  });

  afterEach(async function () {
    await tmp.teardown(tmpDir);
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
