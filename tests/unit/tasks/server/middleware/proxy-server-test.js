'use strict';

const MockProject = require('../../../../helpers/mock-project');
const ProxyServerAddon = require('../../../../../lib/tasks/server/middleware/proxy-server');
const expect = require('chai').expect;

describe('proxy-server', function() {
  let project, proxyServer;

  beforeEach(function() {
    project = new MockProject();
    proxyServer = new ProxyServerAddon(project);
  });

  it(`bypass livereload request`, function() {
    expect(proxyServer.handleProxiedRequest({
      url: '/livereload',
    })).to.undefined;
  });
});

