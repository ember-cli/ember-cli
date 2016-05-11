'use strict';

var expect = require('chai').expect;
var MockUI = require('../../helpers/mock-ui');
var EOL    = require('os').EOL;
var chalk  = require('chalk');

describe('UI', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  describe('writeDebugLine', function() {
    it('does not write at the default level', function() {
      ui.writeDebugLine('foo');
      expect(ui.output).to.equal('');
    });

    it('writes in the correct chalk', function() {
      ui.writeLevel = 'DEBUG';
      ui.writeDebugLine('foo');
      expect(ui.output).to.equal(chalk.gray('foo') + EOL);
    });
  });

  describe('writeInfoLine', function() {
    it('writes in the correct chalk', function() {
      ui.writeInfoLine('foo');
      expect(ui.output).to.equal(chalk.cyan('foo') + EOL);
    });
  });

  describe('writeWarningLine', function() {
    it('does not write when the test is truthy', function() {
      ui.writeWarnLine('foo', true);
      expect(ui.output).to.equal('');
    });

    it('writes a prepended message when the test is falsy', function() {
      ui.writeWarnLine('foo', false);
      expect(ui.output).to.equal(chalk.yellow('WARNING: foo') + EOL);
    });

    it('writes a un-prepended message if prepend is false', function() {
      ui.writeWarnLine('foo', false, false);
      expect(ui.output).to.equal(chalk.yellow('foo') + EOL);
    });
  });

  describe('writeDeprecateLine', function() {
    it('does not write when the test is truthy', function() {
      ui.writeDeprecateLine('foo', true);
      expect(ui.output).to.equal('');
    });

    it('writes a prepended message when the test is falsy', function() {
      ui.writeDeprecateLine('foo', false);
      expect(ui.output).to.equal(chalk.yellow('DEPRECATION: foo') + EOL);
    });

    it('writes a un-prepended message if prepend is false', function() {
      ui.writeDeprecateLine('foo', false, false);
      expect(ui.output).to.equal(chalk.yellow('foo') + EOL);
    });
  });

  describe('prependLine', function() {
    it('prepends the data when prepend is undefined', function() {
      var result = ui.prependLine('foo', 'bar');
      expect(result).to.equal('foo: bar');
    });

    it('prepends the data when prepend is true', function() {
      var result = ui.prependLine('foo', 'bar', true);
      expect(result).to.equal('foo: bar');
    });

    it('returns the original data when prepend is falsy (but not undefined)', function() {
      var result = ui.prependLine('foo', 'bar', false);
      expect(result).to.equal('bar');
    });
  });
});
