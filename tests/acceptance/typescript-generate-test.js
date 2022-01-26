'use strict';

const util = require('util');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
let outputFile = util.promisify(fs.outputFile);
const path = require('path');
let remove = util.promisify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');
const td = require('testdouble');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate', function () {
  this.timeout(20000);

  let tmpdir;

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    tmpdir = await mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function () {
    td.reset();
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm', '--skip-bower']);
  }

  it('transpiles typescript by default', async function () {
    await initApp();

    await outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await outputFile(
      'blueprints/foo-test/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo-test/files/tests/foos/__name__-test.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await ember(['generate', 'foo', 'bar']);
    // test that the resulting file both ends in .js and has had all the TS stuff removed
    const generated = file('app/foos/bar.js');
    expect(generated).to.contain('export default function bar(a, b) {');

    const testGenerated = file('tests/foos/bar-test.js');
    expect(testGenerated).to.contain('export default function bar(a, b) {');
  });

  it('outputs typescript when isTypeScriptProject is true', async function () {
    await initApp();
    await fs.writeJSON('.ember-cli', {
      isTypeScriptProject: true,
    });

    await outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await outputFile(
      'blueprints/foo-test/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo-test/files/tests/foos/__name__-test.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await ember(['generate', 'foo', 'bar']);

    const generated = file('app/foos/bar.ts');
    expect(generated).to.equal(`export default function bar(a: string, b: number): string {
        return a + b;
      }`);

    const testGenerated = file('tests/foos/bar-test.ts');
    expect(testGenerated).to.contain('export default function bar(a: string, b: number): string {');
  });

  it('generates typescript when the `--typescript` flag is used and a typescript blueprint exists', async function () {
    await initApp();

    await outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await outputFile(
      'blueprints/foo-test/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo-test/files/tests/foos/__name__-test.ts',
      `export default function <%= camelizedModuleName %>(a: string, b: number): string {
        return a + b;
      }`
    );

    await ember(['generate', 'foo', 'bar', '--typescript']);
    const generated = file('app/foos/bar.ts');
    expect(generated).to.contain('export default function bar(a: string, b: number): string {');

    const testGenerated = file('tests/foos/bar-test.ts');
    expect(testGenerated).to.contain('export default function bar(a: string, b: number): string {');
  });
});
