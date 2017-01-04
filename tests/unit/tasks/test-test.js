'use strict';

const expect = require('chai').expect;
const TestTask = require('../../../lib/tasks/test');
const MockProject = require('../../helpers/mock-project');

describe('test task test', function() {
  let subject;

  it('transforms options for testem configuration', function() {
    subject = new TestTask({
      project: new MockProject(),
      addonMiddlewares() {
        return ['middleware1', 'middleware2'];
      },

      invokeTestem(options) {
        let testemOptions = this.testemOptions(options);

        expect(testemOptions.host).to.equal('greatwebsite.com');
        expect(testemOptions.port).to.equal(123324);
        expect(testemOptions.cwd).to.equal('blerpy-derpy');
        expect(testemOptions.reporter).to.equal('xunit');
        expect(testemOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        expect(testemOptions.test_page).to.equal('http://my/test/page');
        expect(testemOptions.debug).to.equal('testem.log');
        expect(testemOptions.config_dir).to.be.an('string');
        expect(testemOptions.file).to.equal('custom-testem-config.json');
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
    });
  });
});
