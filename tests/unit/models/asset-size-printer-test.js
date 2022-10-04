'use strict';

const expect = require('chai').expect;
const MockUi = require('console-ui/mock');
const AssetSizePrinter = require('../../../lib/models/asset-size-printer');
const path = require('path');
const fs = require('fs-extra');
let root = process.cwd();
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
let tmpRoot = path.join(root, 'tmp');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

describe('models/asset-size-printer', function () {
  let storedTmpDir, assetDir, assetChildDir;

  function writeFiles() {
    fs.writeFileSync(path.join(assetDir, 'some-project.scss'), 'body { margin: 0 20px; }', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'some-project.css4'), 'body { margin: 0 20px; }', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'some-project.css'), 'body { margin: 0 20px; }', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'some-project.js'), 'module.exports = function () {};', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'some-project.json'), 'module.exports = function () {};', {
      encoding: 'utf8',
    });
    fs.writeFileSync(path.join(assetDir, 'test-loader.js'), 'module.exports = function () {};', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'test-support.js'), 'module.exports = function () {};', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'testem.js'), 'module.exports = function () {};', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'test.js'), 'module.exports = function () {};', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetDir, 'empty.js'), '', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetChildDir, 'nested-asset.css'), 'body { margin: 0 20px; }', { encoding: 'utf8' });
    fs.writeFileSync(path.join(assetChildDir, 'nested-asset.js'), 'module.exports = function () {};', {
      encoding: 'utf8',
    });
  }

  beforeEach(async function () {
    storedTmpDir = await mkTmpDirIn(tmpRoot);
    assetDir = path.join(storedTmpDir, 'assets');
    assetChildDir = path.join(assetDir, 'childDir');

    fs.mkdirsSync(assetDir);
    fs.mkdirsSync(assetChildDir);

    writeFiles();
  });

  afterEach(function () {
    return fs.remove(storedTmpDir);
  });

  it('prints human-readable file sizes (including gzipped sizes) of css and js files in the output path', async function () {
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    await sizePrinter.print();

    expect(sizePrinter.ui.output).to.include('File sizes:');
    expect(sizePrinter.ui.output).to.include('some-project.css');
    expect(sizePrinter.ui.output).to.include('some-project.js');
    expect(sizePrinter.ui.output).to.include('24 B │ 44 B        │ 22 B');
    expect(sizePrinter.ui.output).to.include('32 B │ 52 B        │ 24 B');
  });

  it('does not print gzipped file sizes of empty files', async function () {
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    await sizePrinter.print();

    expect(sizePrinter.ui.output).to.include('0 B  │ /           │ /');
  });

  it('does not print project test helper file sizes', async function () {
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    await sizePrinter.print();

    expect(sizePrinter.ui.output).to.not.include('test-loader');
    expect(sizePrinter.ui.output).to.not.include('test-support');
    expect(sizePrinter.ui.output).to.not.include('testem');
    expect(sizePrinter.ui.output).to.include('test.js');
  });

  it('does not print non-css or js file sizes', async function () {
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    await sizePrinter.print();

    expect(sizePrinter.ui.output).to.not.include('some-project.scss');
    expect(sizePrinter.ui.output).to.not.include('some-project.css4');
    expect(sizePrinter.ui.output).to.not.include('some-project.json');
  });

  it('can print out to JSON', async function () {
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    await sizePrinter.printJSON();

    let output = JSON.parse(sizePrinter.ui.output);

    expect(output.files[0].name).to.include('nested-asset.css');
    expect(output.files[1].name).to.include('nested-asset.js');
    expect(output.files[1].size).to.equal(32);
    expect(output.files[1].gzipSize).to.equal(52);
    expect(output.files[1].brotliSize).to.equal(24);
  });

  it('creates an array of asset objects', async function () {
    let assetObjectKeys;
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir,
    });

    let assetObject = await sizePrinter.makeAssetSizesObject();

    assetObjectKeys = Object.keys(assetObject[0]);

    expect(assetObjectKeys).to.deep.equal(['brotliSize', 'gzipSize', 'name', 'size']);
    expect(assetObject[0].name).to.include('nested-asset.css');
    expect(assetObject[1].name).to.include('nested-asset.js');
    expect(assetObject[2].name).to.include('empty.js');
    expect(assetObject[3].name).to.include('some-project.css');
    expect(assetObject[4].name).to.include('some-project.js');
    expect(assetObject[5].name).to.include('test.js');
  });

  it('prints an error when no files are found', function () {
    let outputPath = path.join('path', 'that', 'does', 'not', 'exist');
    let sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath,
    });

    return expect(sizePrinter.print()).to.be.rejectedWith(
      Error,
      `No asset files found in the provided path: ${outputPath}`
    );
  });
});
