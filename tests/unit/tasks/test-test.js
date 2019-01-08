'use strict';

const expect = require('chai').expect;
const TestTask = require('../../../lib/tasks/test');
const MockProject = require('../../helpers/mock-project');

describe('test task test', function() {
  let subject;

  it('transforms options for testem configuration, uses default cwd when not configured in testem.js file', function() {
    subject = new TestTask({
      project: new MockProject(),
      addonMiddlewares() {
        return ['middleware1', 'middleware2'];
      },

      invokeTestem(options) {
        expect(options.ssl).to.equal(false);
        // cwd is not passed to testem progOptions so takes default value
        let testemOptions = this.transformOptions(options);
        expect(testemOptions.host).to.equal('greatwebsite.com');
        expect(testemOptions.port).to.equal(123324);
        expect(testemOptions.cwd).to.equal('blerpy-derpy');
        expect(testemOptions.reporter).to.equal('xunit');
        expect(testemOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        expect(testemOptions.test_page).to.equal('http://my/test/page');
        expect(testemOptions.config_dir).to.be.an('string');
        expect(testemOptions.key).to.be.undefined;
        expect(testemOptions.cert).to.be.undefined;

        // default cwd is present as part of default options.
        let defaultOptions = this.defaultOptions(options);
        expect(defaultOptions.host).to.equal('greatwebsite.com');
        expect(defaultOptions.port).to.equal(123324);
        expect(defaultOptions.cwd).to.equal('blerpy-derpy');
        expect(defaultOptions.reporter).to.equal('xunit');
        expect(defaultOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        expect(defaultOptions.test_page).to.equal('http://my/test/page');
        expect(defaultOptions.config_dir).to.be.an('string');
      },
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      testemDebug: 'testem.log',
      testPage: 'http://my/test/page',
      configFile: 'custom-testem-config.json',
      ssl: false,
      sslKey: 'ssl/server.key',
      sslCert: 'ssl/server.cert',
    });
  });

  it('transforms options for testem configuration, uses cwd from testem.js file when configured', function() {
    subject = new TestTask({
      project: new MockProject(),
      addonMiddlewares() {
        return ['middleware1', 'middleware2'];
      },

      invokeTestem(options) {
        expect(options.ssl).to.equal(false);
        // cwd is passed to testem progOptions so uses it
        let testemOptions = this.transformOptions(options);
        expect(testemOptions.host).to.equal('greatwebsite.com');
        expect(testemOptions.port).to.equal(123324);
        expect(testemOptions.cwd).to.equal('cwd-from-testem');
        expect(testemOptions.reporter).to.equal('xunit');
        expect(testemOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        expect(testemOptions.test_page).to.equal('http://my/test/page');
        expect(testemOptions.config_dir).to.be.an('string');
        expect(testemOptions.key).to.be.undefined;
        expect(testemOptions.cert).to.be.undefined;

        let defaultOptions = this.defaultOptions(options);
        expect(defaultOptions.host).to.equal('greatwebsite.com');
        expect(defaultOptions.port).to.equal(123324);
        // default cwd is set in defaultOptions
        expect(defaultOptions.cwd).to.equal('blerpy-derpy');
        expect(defaultOptions.reporter).to.equal('xunit');
        expect(defaultOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        expect(defaultOptions.test_page).to.equal('http://my/test/page');
        expect(defaultOptions.config_dir).to.be.an('string');
      },
    });

    subject.run({
      cwd: 'cwd-from-testem',
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      testemDebug: 'testem.log',
      testPage: 'http://my/test/page',
      configFile: 'custom-testem-config.json',
      ssl: false,
      sslKey: 'ssl/server.key',
      sslCert: 'ssl/server.cert',
    });
  });

  it('supports conditionally passing SSL configuration forward', function() {
    subject = new TestTask({
      project: new MockProject(),

      invokeTestem(options) {
        expect(options.ssl).to.equal(true);

        let testemOptions = this.transformOptions(options);
        expect(testemOptions.key).to.equal('ssl/server.key');
        expect(testemOptions.cert).to.equal('ssl/server.cert');
      },
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      testemDebug: 'testem.log',
      testPage: 'http://my/test/page',
      configFile: 'custom-testem-config.json',
      ssl: true,
      sslKey: 'ssl/server.key',
      sslCert: 'ssl/server.cert',
    });
  });
});
