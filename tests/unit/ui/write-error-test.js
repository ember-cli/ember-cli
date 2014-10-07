'use strict';

var assert     = require('assert');
var writeError = require('../../../lib/ui/write-error');
var MockUI     = require('../../helpers/mock-ui');
var BuildError = require('../../helpers/build-error');
var EOL        = require('os').EOL;
var chalk      = require('chalk');

describe('writeError', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  it('no error', function() {
    writeError(ui);
  });

  it('error with message', function() {
    writeError(ui, new BuildError({
      message: 'build error'
    }));

    assert.equal(ui.output, chalk.red('build error') + EOL);
  });

  it('error with stack', function() {
    writeError(ui, new BuildError({
      stack: 'the stack'
    }));

    assert.equal(ui.output, chalk.red('Error') + EOL + 'the stack' + EOL);
  });

  it('error with file', function() {
    writeError(ui, new BuildError({
      file: 'the file'
    }));

    assert.equal(ui.output, chalk.red('File: the file') + EOL + chalk.red('Error') + EOL);
  });

  it('error with file + line', function() {
    writeError(ui, new BuildError({
      file: 'the file',
      line: 'the line'
    }));

    assert.equal(ui.output, chalk.red('File: the file (the line)') + EOL + chalk.red('Error') + EOL);
  });

  it('error with file + col', function() {
    writeError(ui, new BuildError({
      file: 'the file',
      col: 'the col'
    }));

    assert.equal(ui.output, chalk.red('File: the file') + EOL + chalk.red('Error') + EOL);
  });

  it('error with file + line + col', function() {
    writeError(ui, new BuildError({
      file: 'the file',
      line: 'the line',
      col:  'the col'
    }));

    assert.equal(ui.output, chalk.red('File: the file (the line:the col)') + EOL + chalk.red('Error') + EOL);
  });
});
