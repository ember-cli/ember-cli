'use strict';

const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');
const EOL = require('os').EOL;
const insertIntoFile = require('../../../lib/utilities/insert-into-file');

const expect = require('chai').expect;

describe('insertIntoFile()', function() {
  let tempDir, filePath;

  beforeEach(function() {
    tempDir = temp.mkdirSync('insert-into-file-test');
    filePath = path.join(tempDir, 'foo-bar-baz.txt');
  });

  afterEach(function() {
    fs.removeSync(tempDir);
  });

  it('will create the file if not already existing', function() {
    let toInsert = 'blahzorz blammo';

    return insertIntoFile(filePath, toInsert).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.contain(toInsert);
      expect(result.originalContents).to.equal('', 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
      expect(contents).to.equal(result.contents, 'returned object should contain contents');
    });
  });

  it('will not create the file if not already existing and creation disabled', function() {
    let toInsert = 'blahzorz blammo';

    return insertIntoFile(filePath, toInsert, { create: false }).then(function(result) {
      expect(fs.existsSync(filePath)).to.equal(false, 'file should not exist');
      expect(result.originalContents).to.equal('', 'returned object should contain original contents');
      expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
      expect(result.contents).to.equal('', 'returned object should contain original contents');
    });
  });

  it('will insert into the file if it already exists', function() {
    let toInsert = 'blahzorz blammo';
    let originalContent = 'some original content\n';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(originalContent + toInsert, 'inserted contents should be appended to original');
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
    });
  });

  it('will not insert into the file if it already contains the content', function() {
    let toInsert = 'blahzorz blammo';

    fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(toInsert, 'contents should be unchanged');
      expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
    });
  });

  it('will insert into the file if it already contains the content if force option is passed', function() {
    let toInsert = 'blahzorz blammo';

    fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { force: true }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(toInsert + toInsert, 'contents should be unchanged');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was not modified');
    });
  });

  it('will insert into the file after a specified string if options.after is specified', function() {
    let toInsert = 'blahzorz blammo';
    let line1 = 'line1 is here';
    let line2 = 'line2 here';
    let line3 = 'line3';
    let originalContent = [line1, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { after: line2 + EOL }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(
        [line1, line2, toInsert, line3].join(EOL),
        'inserted contents should be inserted after the `after` value'
      );
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
    });
  });

  it('will insert into the file after the first instance of options.after only', function() {
    let toInsert = 'blahzorz blammo';
    let line1 = 'line1 is here';
    let line2 = 'line2 here';
    let line3 = 'line3';
    let originalContent = [line1, line2, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { after: line2 + EOL }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(
        [line1, line2, toInsert, line2, line3].join(EOL),
        'inserted contents should be inserted after the `after` value'
      );
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
    });
  });

  it('will insert into the file before a specified string if options.before is specified', function() {
    let toInsert = 'blahzorz blammo';
    let line1 = 'line1 is here';
    let line2 = 'line2 here';
    let line3 = 'line3';
    let originalContent = [line1, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { before: line2 + EOL }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(
        [line1, toInsert, line2, line3].join(EOL),
        'inserted contents should be inserted before the `before` value'
      );
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
    });
  });

  it('will insert into the file before the first instance of options.before only', function() {
    let toInsert = 'blahzorz blammo';
    let line1 = 'line1 is here';
    let line2 = 'line2 here';
    let line3 = 'line3';
    let originalContent = [line1, line2, line2, line3].join(EOL);

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { before: line2 + EOL }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(
        [line1, toInsert, line2, line2, line3].join(EOL),
        'inserted contents should be inserted after the `after` value'
      );
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
    });
  });

  it('it will make no change if options.after is not found in the original', function() {
    let toInsert = 'blahzorz blammo';
    let originalContent = 'the original content';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { after: `not found${EOL}` }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(originalContent, 'original content is unchanged');
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
    });
  });

  it('it will make no change if options.before is not found in the original', function() {
    let toInsert = 'blahzorz blammo';
    let originalContent = 'the original content';

    fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

    return insertIntoFile(filePath, toInsert, { before: `not found${EOL}` }).then(function(result) {
      let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

      expect(contents).to.equal(originalContent, 'original content is unchanged');
      expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
      expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
    });
  });

  describe('regex', function() {
    it('options.after supports regex', function() {
      let toInsert = 'blahzorz blammo';
      let line1 = 'line1 is here';
      let line2 = 'line2 here';
      let line3 = 'line3';
      let originalContent = [line1, line2, line3].join(EOL);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return insertIntoFile(filePath, toInsert, { after: /line2 here(\r?\n)/ }).then(function() {
        let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(
          [line1, line2, toInsert, line3].join(EOL),
          'inserted contents should be inserted after the `after` value'
        );
      });
    });

    it('options.before supports regex', function() {
      let toInsert = 'blahzorz blammo';
      let line1 = 'line1 is here';
      let line2 = 'line2 here';
      let line3 = 'line3';
      let originalContent = [line1, line2, line3].join(EOL);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return insertIntoFile(filePath, toInsert, { before: /line2 here(\r?\n)/ }).then(function() {
        let contents = fs.readFileSync(filePath, { encoding: 'utf8' });

        expect(contents).to.equal(
          [line1, toInsert, line2, line3].join(EOL),
          'inserted contents should be inserted before the `before` value'
        );
      });
    });

    it("options.after doesn't treat strings as regex", function() {
      let toInsert = 'blahzorz blammo';

      fs.writeFileSync(filePath, '', { encoding: 'utf8' });

      expect(() => insertIntoFile(filePath, toInsert, { after: '"predef": [\n' })).to.not.throw();
    });

    it("options.before doesn't treat strings as regex", function() {
      let toInsert = 'blahzorz blammo';

      fs.writeFileSync(filePath, '', { encoding: 'utf8' });

      expect(() => insertIntoFile(filePath, toInsert, { before: '"predef": [\n' })).to.not.throw();
    });
  });

  it('will return the file path', function() {
    let toInsert = 'blahzorz blammo';

    return insertIntoFile(filePath, toInsert).then(function(result) {
      expect(result.path).to.equal(filePath, 'path should always match');
    });
  });
});
