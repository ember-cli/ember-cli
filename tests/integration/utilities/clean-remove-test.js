'use strict';

var expect = require('chai').expect;
var cleanRemove = require('../../../lib/utilities/clean-remove');
var temp = require('temp');
var path = require('path');
var Promise = require('../../../lib/ext/promise');
var fs = require('fs-extra');

var outputFile = Promise.denodeify(fs.outputFile);
var stat = Promise.denodeify(fs.stat);

describe('clean-remove', function() {
  var tempDir;
  var originalCwd = process.cwd();
  var fileInfo;
  var nestedPath = 'nested1/nested2';

  beforeEach(function() {
    tempDir = temp.mkdirSync('clean-remove');
    process.chdir(tempDir);

    fileInfo = {
      outputBasePath: tempDir,
    };
  });

  afterEach(function() {
    process.chdir(originalCwd);
    fs.removeSync(tempDir);
  });

  it('removes empty folders', function() {
    var displayPath = path.join(nestedPath, 'file.txt');
    fileInfo.outputPath = path.join(tempDir, displayPath);
    fileInfo.displayPath = displayPath;

    return outputFile(displayPath, '').then(function() {
      return stat(displayPath).then(function(stats) {
        expect(stats).to.be.ok;
      });
    }).then(function() {
      return cleanRemove(fileInfo);
    }).then(function() {
      return stat('nested1').then(function() {
        expect(false).to.be.ok;
      }).catch(function(err) {
        expect(err).to.be.ok;
      });
    });
  });

  it('preserves filled folders', function() {
    var removedDisplayPath = path.join(nestedPath, 'file.txt');
    var preservedDisplayPath = path.join(nestedPath, 'file2.txt');
    fileInfo.outputPath = path.join(tempDir, removedDisplayPath);
    fileInfo.displayPath = removedDisplayPath;

    return outputFile(removedDisplayPath, '').then(function() {
      return outputFile(preservedDisplayPath, '');
    }).then(function() {
      return stat(preservedDisplayPath).then(function(stats) {
        expect(stats).to.be.ok;
      });
    }).then(function() {
      return cleanRemove(fileInfo);
    }).then(function() {
      return stat(removedDisplayPath).then(function() {
        expect(false).to.be.ok;
      }).catch(function(err) {
        expect(err).to.be.ok;
      });
    }).then(function() {
      return stat(preservedDisplayPath).then(function(stats) {
        expect(stats).to.be.ok;
      });
    });
  });
});
