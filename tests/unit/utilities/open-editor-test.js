'use strict';

var openEditor = require('../../../lib/utilities/open-editor');

var expect = require('chai').expect;
var td = require('testdouble');

describe('open-editor', function() {
  beforeEach(function() {
    td.replace(openEditor, '_env');
    td.replace(openEditor, '_spawn');
  });

  afterEach(function() {
    td.reset();
  });

  it('throws if EDITOR is not set', function() {
    td.when(openEditor._env()).thenReturn({});
    expect(function() { openEditor('test') }).to.throw('EDITOR environment variable is not set');
  });

  it('spawns EDITOR with passed file', function() {
    td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
    openEditor('test');
    td.verify(openEditor._spawn('vi', ['test'], { stdio: 'inherit' }));
  });

  it('throws if no file option is provided', function() {
    td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
    expect(function() { openEditor() }).to.throw('No `file` option provided');
  });

  describe('.canEdit()', function() {
    it('returns false if EDITOR is not set', function() {
      td.when(openEditor._env()).thenReturn({});
      expect(openEditor.canEdit()).to.be.false;
    });

    it('returns true if EDITOR is set', function() {
      td.when(openEditor._env()).thenReturn({ EDITOR: 'vi' });
      expect(openEditor.canEdit()).to.be.true;
    });
  });
});


