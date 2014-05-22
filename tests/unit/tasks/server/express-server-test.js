'use strict';

var assert        = require('../../../helpers/assert');
var expressServer = require('../../../../lib/tasks/server/express-server');
var MockUI        = require('../../../helpers/mock-ui');
var MockProject   = require('../../../helpers/mock-project');

describe('express-server', function() {
  it('should start proxy if ```proxy``` URI is given', function() {
    expressServer.ui = new MockUI();
    expressServer.project = new MockProject();
    return expressServer.start({proxy: 'http://localhost:3000/'}).then(function() {
      var output = expressServer.ui.output.trim().split('\n');
      assert.deepEqual(output.length, 2, 'expected extra line for proxy');
    });
  });
});
