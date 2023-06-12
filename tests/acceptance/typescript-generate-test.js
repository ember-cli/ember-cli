'use strict';

const ember = require('../helpers/ember');
const { outputFile, remove, writeJson } = require('fs-extra');
const path = require('path');
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');
const td = require('testdouble');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate with typescript blueprints', function () {
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
    return ember(['init', '--name=my-app', '--skip-npm']);
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
    await writeJson('.ember-cli', {
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

  it('outputs typescript {typescript: true} is present in .ember-cli', async function () {
    await initApp();
    await writeJson('.ember-cli', {
      typescript: true,
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

    await ember(['generate', 'foo', 'bar', '--typescript']);
    const generated = file('app/foos/bar.ts');
    expect(generated).to.contain('export default function bar(a: string, b: number): string {');
  });

  it('does not generate typescript when the `--typescript` flag is used but no typescript blueprint exists', async function () {
    await initApp();

    await outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      `export default function <%= camelizedModuleName %>(a, b) {
        return a + b;
      }`
    );

    const result = await ember(['generate', 'foo', 'bar', '--typescript']);
    const output = result.outputStream.map((v) => v.toString());
    const generated = file('app/foos/bar.js');

    expect(generated).to.contain('export default function bar(a, b) {');
    expect(output.join('\n')).to.contain(
      "You passed the '--typescript' flag but there is no TypeScript blueprint available."
    );
  });

  it('does not generate typescript when the `--no-typescript` flag, even if a typescript blueprint exists', async function () {
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

    await ember(['generate', 'foo', 'bar', '--no-typescript']);
    const generated = file('app/foos/bar.js');
    expect(generated).to.contain('export default function bar(a, b) {');
  });

  it('does not generate typescript when the `--no-typescript` flag, even if isTypeScriptProject is true', async function () {
    await initApp();

    await writeJson('.ember-cli', {
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

    await ember(['generate', 'foo', 'bar', '--no-typescript']);
    const generated = file('app/foos/bar.js');
    expect(generated).to.contain('export default function bar(a, b) {');
  });

  it('can generate classes with decorators and class fields', async function () {
    await initApp();

    await outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      `export default class <%= classifiedModuleName %> {
        bar = 'bar';

        @action
        foo() {
          return a + b;
        }
      }\n`
    );

    const expected = `export default class Bar {
  bar = 'bar';

  @action
  foo() {
    return a + b;
  }
}\n`;

    await ember(['generate', 'foo', 'bar']);
    const generated = file('app/foos/bar.js');
    expect(generated).to.equal(expected);
  });
});
