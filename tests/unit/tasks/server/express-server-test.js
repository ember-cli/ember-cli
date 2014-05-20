'use strict';

var assert        = require('../../../helpers/assert');
var ExpressServer = require('../../../../lib/tasks/server/express-server');
var MockUI        = require('../../../helpers/mock-ui');
var MockProject   = require('../../../helpers/mock-project');

describe('express-server', function() {
  var subject, ui, project;

  before(function() {
    ui = new MockUI();
    project = new MockProject();

    subject = new ExpressServer({
      ui: ui,
      project: project
    });
  });

  it('should start proxy if ```proxy``` URI is given', function() {
    return subject.start({proxy: 'http://localhost:3000/'}).then(function() {
      var output = ui.output.trim().split('\n');
      assert.deepEqual(output.length, 2, 'expected extra line for proxy');
    });
  });
});
