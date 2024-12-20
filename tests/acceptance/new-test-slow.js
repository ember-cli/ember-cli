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

  describe('ember new', function () {
    it('generates a new app with no linting errors', async function () {
      await ember(['new', 'foo-app', '--pnpm', '--skip-git']);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-app') });
    });

    it('generates a new TS app with no linting errors', async function () {
      await ember(['new', 'foo-app', '--pnpm', '--skip-git', '--typescript']);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-app') });
    });
  });

  describe('ember addon', function () {
    it('generates a new addon with no linting errors', async function () {
      await ember(['addon', 'foo-addon', '--pnpm', '--skip-git']);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-addon') });
    });

    it('generates a new TS addon with no linting errors', async function () {
      await ember(['addon', 'foo-addon', '--pnpm', '--skip-git', '--typescript']);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-addon') });
    });
  });
});
