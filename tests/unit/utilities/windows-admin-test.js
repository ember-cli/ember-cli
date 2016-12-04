'use strict';

var WindowsSymlinkChecker = require('../../../lib/utilities/windows-admin');
var expect = require('chai').expect;
var MockUI = require('console-ui/mock');
var td = require('testdouble');
var symlinkOrCopy = require('symlink-or-copy');

describe('windows-admin', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  describe('on windows', function() {
    var isWindows = true;

    describe('can symlink', function() {
      var canSymlink = true;

      it('attempts to determine admin rights if Windows', function() {
        var exec = td.function('exec');

        var checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

        return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
          expect(result).to.be.ok;
          expect(result.windows).to.be.eql(true);
          expect(result.elevated).to.be.eql(null);
          td.verify(exec(), { times: 0 });
          expect(ui.output).to.eql('');
        });
      });
    });

    describe('cannot symlink', function() {
      var canSymlink = false;

      describe('attempts to determine admin rights', function() {
        it('gets STDERR during NET SESSION exec', function() {
          var exec = td.function('exec');
          td.when(exec('NET SESSION', td.callback(null, null, 'error'))).thenReturn();

          var checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

          return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
            expect(result.windows, 'is windows').to.be.eql(true)
            expect(result.elevated, 'is not elevated').to.be.eql(false);
            td.verify(exec(td.matchers.contains('NET SESSION'), td.matchers.anything()), { times: 1 });
            expect(ui.output).to.match(/Running without permission to symlink will degrade build peformance/);
            expect(ui.output).to.match(/See http\:\/\/ember-cli\.com\/user-guide\/#windows for details./);
          });
        });

        it('gets no stdrrduring NET  SESSION exec', function() {
          var exec = td.function('exec');
          td.when(exec('NET SESSION', td.callback(null, null, null))).thenReturn();

          var checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

          return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
            expect(result.windows, 'is windows').to.be.eql(true)
            expect(result.elevated, 'is elevated').to.be.eql(true);
            td.verify(exec(td.matchers.contains('NET SESSION'), td.matchers.anything()), { times: 1 });
            expect(ui.output).to.eql('');
          });
        });
      });
    });
  });

  describe('on linux', function() {
    var isWindows = false;
    var canSymlink = true;

    it('does not attempt to determine admin', function() {
      var exec = td.function('exec');
      var checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

      return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
        expect(result.windows).to.be.eql(false);
        expect(result.elevated).to.be.eql(null);
        expect(td.explain(exec).callCount).to.eql(0);
        expect(ui.output).to.eql('');
      });
    });
  });

  describe('on darwin', function() {
    var isWindows = false;
    var canSymlink = true;

    it('does not attempt to determine admin', function() {
      var checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink /* exec spy */);
      var exec = td.function('exec');

      return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
        expect(result.windows).to.be.eql(false);
        expect(result.elevated).to.be.eql(null);
        expect(td.explain(exec).callCount).to.eql(0);
        expect(ui.output).to.eql('');
      });
    });
  });
});
