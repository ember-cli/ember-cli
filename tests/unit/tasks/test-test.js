'use strict';

var expect      = require('chai').expect;
var TestTask    = require('../../../lib/tasks/test');
var MockProject = require('../../helpers/mock-project');

describe('test', function() {
  var subject;

  it('transforms options for testem configuration', function() {
    subject = new TestTask({
      project: new MockProject(),
      addonMiddlewares: function() {
        return ['middleware1', 'middleware2'];
      },

      invokeTestem: function(options) {
        var testemOptions = this.testemOptions(options);

        expect(testemOptions.host).to.equal('greatwebsite.com');
        expect(testemOptions.port).to.equal(123324);
        expect(testemOptions.cwd).to.equal('blerpy-derpy');
        expect(testemOptions.reporter).to.equal('xunit');
        expect(testemOptions.middleware).to.deep.equal(['middleware1', 'middleware2']);
        /* jshint ignore:start */
        expect(testemOptions.test_page).to.equal('http://my/test/page');
        expect(testemOptions.config_dir).to.be.an('string');
        /* jshint ignore:end*/
        expect(testemOptions.file).to.equal('custom-testem-config.json');
      }
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      testPage: 'http://my/test/page',
      configFile: 'custom-testem-config.json'
    });
  });
});
