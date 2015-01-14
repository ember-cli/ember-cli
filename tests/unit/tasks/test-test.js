'use strict';

var expect      = require('chai').expect;
var TestTask    = require('../../../lib/tasks/test');
var MockProject = require('../../helpers/mock-project');

describe('test', function() {
  var subject;

  it('transforms the options and invokes testem properly', function() {
    subject = new TestTask({
      project: new MockProject(),
      addonMiddlewares: function() {
        return ['middleware1', 'middleware2'];
      },
      testem: {
        startCI: function(options, cb) {
          expect(options.file).to.equal('blahzorz.conf');
          expect(options.port).to.equal(123324);
          expect(options.cwd).to.equal('blerpy-derpy');
          expect(options.middleware).to.deep.equal(['middleware1', 'middleware2']);
          cb(0);
        },
        app: { reporter: { total: 1 } }
      }
    });

    subject.run({
      configFile: 'blahzorz.conf',
      port: 123324,
      outputPath: 'blerpy-derpy'
    });
  });
});
