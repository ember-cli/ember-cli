'use strict';

const tmp = require('tmp-promise');
const { execa } = require('execa');
const { join, resolve } = require('node:path');
const ember = require('../helpers/ember');

const emberCliRoot = resolve(join(__dirname, '../..'));
const root = process.cwd();
let tmpDir;

describe('Acceptance: ember addon (slow)', function () {
  this.timeout(500000);

  beforeEach(async function () {
    const { path } = await tmp.dir();
    tmpDir = path;
    process.chdir(path);
  });

  afterEach(function () {
    process.chdir(root);
  });

  describe('ember addon', function () {
    it('generates a new addon with no linting errors', async function () {
      await ember(['addon', 'foo-addon', '--pnpm', '--skip-npm']);
      // link current version of ember-cli in the newly generated app
      await execa('pnpm', ['link', emberCliRoot]);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-addon') });
    });

    it('generates a new TS addon with no linting errors', async function () {
      await ember(['addon', 'foo-addon', '--pnpm', '--typescript', '--skip-npm']);
      // link current version of ember-cli in the newly generated app
      await execa('pnpm', ['link', emberCliRoot]);
      await execa('pnpm', ['lint'], { cwd: join(tmpDir, 'foo-addon') });
    });
  });
});
