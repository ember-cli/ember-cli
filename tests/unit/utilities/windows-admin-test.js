'use strict';

const WindowsSymlinkChecker = require('../../../lib/utilities/windows-admin');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const td = require('testdouble');

describe('windows-admin', function() {
  let ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  describe('on windows', function() {
    let isWindows = true;

    describe('can symlink', function() {
      let canSymlink = true;

      it('attempts to determine admin rights if Windows', function() {
        let exec = td.function('exec');

        let checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

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
      let canSymlink = false;

      describe('attempts to determine admin rights', function() {
        it('gets STDERR during NET SESSION exec', function() {
          let exec = td.function('exec');
          td.when(exec('NET SESSION', td.callback(null, null, 'error'))).thenReturn();

          let checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

          return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
            expect(result.windows, 'is windows').to.be.eql(true);
            expect(result.elevated, 'is not elevated').to.be.eql(false);
            td.verify(exec(td.matchers.contains('NET SESSION'), td.matchers.anything()), { times: 1 });
            expect(ui.output).to.match(/Running without permission to symlink will degrade build performance/);
            expect(ui.output).to.match(/See https:\/\/cli.emberjs.com\/release\/appendix\/windows\/ for details./);
          });
        });

        it('gets no stdrrduring NET  SESSION exec', function() {
          let exec = td.function('exec');
          td.when(exec('NET SESSION', td.callback(null, null, null))).thenReturn();

          let checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

          return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
            expect(result.windows, 'is windows').to.be.eql(true);
            expect(result.elevated, 'is elevated').to.be.eql(true);
            td.verify(exec(td.matchers.contains('NET SESSION'), td.matchers.anything()), { times: 1 });
            expect(ui.output).to.eql('');
          });
        });
      });
    });
  });

  describe('on linux', function() {
    let isWindows = false;
    let canSymlink = true;

    it('does not attempt to determine admin', function() {
      let exec = td.function('exec');
      let checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink, exec);

      return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
        expect(result.windows).to.be.eql(false);
        expect(result.elevated).to.be.eql(null);
        expect(td.explain(exec).callCount).to.eql(0);
        expect(ui.output).to.eql('');
      });
    });
  });

  describe('on darwin', function() {
    let isWindows = false;
    let canSymlink = true;

    it('does not attempt to determine admin', function() {
      let checker = new WindowsSymlinkChecker(ui, isWindows, canSymlink /* exec spy */);
      let exec = td.function('exec');

      return checker.checkIfSymlinksNeedToBeEnabled().then(function(result) {
        expect(result.windows).to.be.eql(false);
        expect(result.elevated).to.be.eql(null);
        expect(td.explain(exec).callCount).to.eql(0);
        expect(ui.output).to.eql('');
      });
    });
  });
});
