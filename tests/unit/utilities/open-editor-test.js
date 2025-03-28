'use strict';

const openEditor = require('@ember/blueprint-model/utilities/open-editor');

const { expect } = require('chai');
const td = require('testdouble');

describe('open-editor', function () {
  beforeEach(function () {
    td.replace(openEditor, '_env');
    td.replace(openEditor, '_spawn');
  });

  afterEach(function () {
    td.reset();
  });

  it('throws if EDITOR is not set', async function () {
    td.when(openEditor._env()).thenReturn({});
    try {
      await openEditor('test');
      expect.fail('expected rejection');
    } catch (e) {
      expect(e.message).to.eql('EDITOR environment variable is not set');
    }
  });

  it('spawns EDITOR with passed file', async function () {
    td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
    td.when(openEditor._spawn(td.matchers.anything(), td.matchers.anything(), td.matchers.anything())).thenReturn({
      on(event, cb) {
        cb(0);
      },
    });

    await openEditor('test');
    td.verify(openEditor._spawn('vi', ['test'], { stdio: 'inherit' }));
  });

  it('spawns EDITOR with passed file (rejection scenario)', async function () {
    td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
    td.when(openEditor._spawn(td.matchers.anything(), td.matchers.anything(), td.matchers.anything())).thenReturn({
      on(event, cb) {
        cb(-1);
      },
    });

    try {
      await openEditor('test');
      expect.fail('expected rejection');
    } catch (e) {
      expect(e.message).to.include(`exited with a non zero error status code: '-1'`);
    }

    td.verify(openEditor._spawn('vi', ['test'], { stdio: 'inherit' }));
  });
  it('throws if no file option is provided', async function () {
    td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });

    try {
      await openEditor();
      expect.fail('expected rejection');
    } catch (e) {
      expect(e.message).to.eql('No `file` option provided');
    }
  });

  describe('.canEdit()', function () {
    it('returns false if EDITOR is not set', function () {
      td.when(openEditor._env()).thenReturn({});
      expect(openEditor.canEdit()).to.be.false;
    });

    it('returns true if EDITOR is set', function () {
      td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
      expect(openEditor.canEdit()).to.be.true;
    });
  });
});
