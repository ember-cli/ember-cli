'use strict';

var fs = require('fs-extra');
var path = require('path');
var temp = require('temp');
var EOL = require('os').EOL;
var insertIntoFile = require('../../../lib/utilities/insert-into-file');

var expect = require('chai').expect;

describe('insertIntoFile()', function() {
  var tempDir, filePath;

  beforeEach(function() {
    tempDir = temp.mkdirSync('insert-into-file-test');
    filePath = path.join(tempDir, 'foo-bar-baz.txt');
  });

  afterEach(function() {
    fs.removeSync(tempDir);
  });

  it('will create the file if not already existing', function() {
    var toInsert = 'blahzorz blammo';

    return insertIntoFile(filePath, toInsert)
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.contain(toInsert);
        expect(result.originalContents).to.equal('', 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
        expect(contents).to.equal(result.contents, 'returned object should contain contents');
      });
  });

  it('will insert into the file if it already exists', function() {
    var toInsert = 'blahzorz blammo';
    var originalContent = 'some original content\n';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert)
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(originalContent + toInsert, 'inserted contents should be appended to original');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      });
  });

  it('will not insert into the file if it already contains the content', function() {
    var toInsert = 'blahzorz blammo';

    fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert)
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(toInsert, 'contents should be unchanged');
        expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
      });
  });

  it('will insert into the file if it already contains the content if force option is passed', function() {
    var toInsert = 'blahzorz blammo';

    fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { force: true })
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(toInsert + toInsert, 'contents should be unchanged');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was not modified');
      });
  });

  it('will insert into the file after a specified string if options.after is specified', function() {
    var toInsert = 'blahzorz blammo';
    var line1 = 'line1 is here';
    var line2 = 'line2 here';
    var line3 = 'line3';
    var originalContent = [line1, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {after: line2 + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal([line1, line2, toInsert, line3].join(EOL),
                     'inserted contents should be inserted after the `after` value');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      });
  });

  it('will insert into the file after the first instance of options.after only', function() {
    var toInsert = 'blahzorz blammo';
    var line1 = 'line1 is here';
    var line2 = 'line2 here';
    var line3 = 'line3';
    var originalContent = [line1, line2, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {after: line2 + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal([line1, line2, toInsert, line2, line3].join(EOL),
                     'inserted contents should be inserted after the `after` value');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      });
  });

  it('will insert into the file before a specified string if options.before is specified', function() {
    var toInsert = 'blahzorz blammo';
    var line1 = 'line1 is here';
    var line2 = 'line2 here';
    var line3 = 'line3';
    var originalContent = [line1, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {before: line2 + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal([line1, toInsert, line2, line3].join(EOL),
                     'inserted contents should be inserted before the `before` value');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      });
  });

  it('will insert into the file before the first instance of options.before only', function() {
    var toInsert = 'blahzorz blammo';
    var line1 = 'line1 is here';
    var line2 = 'line2 here';
    var line3 = 'line3';
    var originalContent = [line1, line2, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {before: line2 + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal([line1, toInsert, line2, line2, line3].join(EOL),
                     'inserted contents should be inserted after the `after` value');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      });
  });


  it('it will make no change if options.after is not found in the original', function() {
    var toInsert = 'blahzorz blammo';
    var originalContent = 'the original content';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {after: 'not found' + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(originalContent, 'original content is unchanged');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
      });
  });

  it('it will make no change if options.before is not found in the original', function() {
    var toInsert = 'blahzorz blammo';
    var originalContent = 'the original content';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, {before: 'not found' + EOL})
      .then(function(result) {
        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(originalContent, 'original content is unchanged');
        expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
        expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
      });
  });
});
