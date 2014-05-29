'use strict';

var assert        = require('../../../helpers/assert');
var ExpressServer = require('../../../../lib/tasks/server/express-server');
var MockUI        = require('../../../helpers/mock-ui');
var MockProject   = require('../../../helpers/mock-project');

describe('express-server', function() {
  var subject, ui, project;

  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();

    subject = new ExpressServer({
      ui: ui,
      project: project
    });
  });

  describe('output', function() {
    it('with proxy', function() {
      return subject.start({
        proxy: 'http://localhost:3001/',
        host:  '0.0.0.0',
        port: '1337',
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[1], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output[0], 'Proxying to http://localhost:3001/');
        assert.deepEqual(output.length, 2, 'expected only two lines of output');
      });
    });

    it('without proxy', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337'
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[0], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output.length, 1, 'expected only one line of output');
      });
    });
  });

  describe('behaviour', function() {
    describe('with proxy', function() {
      beforeEach(function() {
        return subject.start({
          proxy: 'http://localhost:3001/',
          host:  '0.0.0.0',
          port: '1337',
        });
      });

      it('proxies GET',    function() { });
      it('proxies PUT',    function() { });
      it('proxies POST',   function() { });
      it('proxies DELETE', function() { });
    });
  });
});
