'use strict';

var expect           = require('chai').expect;
var MockUi           = require('../../helpers/mock-ui');
var AssetSizePrinter = require('../../../lib/models/asset-size-printer');
var Promise          = require('../../../lib/ext/promise');
var path             = require('path');
var fs               = require('fs-extra');
var existsSync       = require('exists-sync');
var root             = process.cwd();
var mkTmpDirIn       = require('../../../lib/utilities/mk-tmp-dir-in');
var tmpRoot          = path.join(root, 'tmp');
var remove           = Promise.denodeify(fs.remove);

describe('models/asset-size-printer', function () {
  var storedTmpDir, assetDir, assetChildDir;

  function writeFiles() {
    fs.writeFileSync(path.join(assetDir, 'some-project.scss'), 'body { margin: 0 20px; }', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'some-project.css4'), 'body { margin: 0 20px; }', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'some-project.css'), 'body { margin: 0 20px; }', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'some-project.js'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'some-project.json'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'test-loader.js'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'test-support.js'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'testem.js'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'test.js'), 'module.exports = function () {};', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetDir, 'empty.js'), '', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetChildDir, 'nested-asset.css'), 'body { margin: 0 20px; }', {encoding: 'utf8'});
    fs.writeFileSync(path.join(assetChildDir, 'nested-asset.js'), 'module.exports = function () {};', {encoding: 'utf8'});
  }

  beforeEach(function () {
    return mkTmpDirIn(tmpRoot).then(function (tmpdir) {
      storedTmpDir = tmpdir;
      assetDir = path.join(storedTmpDir, 'assets');
      assetChildDir = path.join(assetDir, 'childDir');
      if (!existsSync(assetDir)) {
        fs.mkdirSync(assetDir);
      }
      if (!existsSync(assetChildDir)) {
        fs.mkdirSync(assetChildDir);
      }

      writeFiles();
    });
  });

  afterEach(function () {
    return Promise.all([
      remove(storedTmpDir)
    ]);
  });

  it('prints human-readable file sizes (including gzipped sizes) of css and js files in the output path', function () {
    var sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir
    });

    return sizePrinter.print()
      .then(function () {
        expect(sizePrinter.ui.output).to.include('File sizes:');
        expect(sizePrinter.ui.output).to.include('some-project.css: ');
        expect(sizePrinter.ui.output).to.include('some-project.js: ');
        expect(sizePrinter.ui.output).to.include('24 B');
        expect(sizePrinter.ui.output).to.include('32 B');
        expect(sizePrinter.ui.output).to.include('(44 B gzipped)');
        expect(sizePrinter.ui.output).to.include('(52 B gzipped)');
      });
  });

  it('does not print gzipped file sizes of empty files', function () {
    var sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir
    });

    return sizePrinter.print()
      .then(function () {
        expect(sizePrinter.ui.output).to.not.include('0 B gzipped)');
      });
  });

  it('does not print project test helper file sizes', function () {
    var sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir
    });

    return sizePrinter.print()
      .then(function () {
        expect(sizePrinter.ui.output).to.not.include('test-loader');
        expect(sizePrinter.ui.output).to.not.include('test-support');
        expect(sizePrinter.ui.output).to.not.include('testem');
        expect(sizePrinter.ui.output).to.include('test.js');
      });
  });

  it('does not print non-css or js file sizes', function () {
    var sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: storedTmpDir
    });

    return sizePrinter.print()
      .then(function () {
        expect(sizePrinter.ui.output).to.not.include('some-project.scss');
        expect(sizePrinter.ui.output).to.not.include('some-project.css4');
        expect(sizePrinter.ui.output).to.not.include('some-project.json');
      });
  });

  it('prints an error when no files are found', function () {
    var outputPath = path.join('path', 'that', 'does', 'not', 'exist');
    var sizePrinter = new AssetSizePrinter({
      ui: new MockUi(),
      outputPath: outputPath
    });

    return sizePrinter.print()
      .catch(function (error) {
        expect(error.message).to.include('No asset files found in the path provided: ' + outputPath);
      });
  });
});
