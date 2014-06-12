'use strict';

var Project = require('../../../lib/models/project');
var tmp     = require('../../helpers/tmp');
var touch   = require('../../helpers/fs-utils').touch;
var assert  = require('assert');

describe('models/project.js', function() {
  var project;
  var path = process.cwd() + '/tmp/test-app';
  var called = false;

  before(function() {
    Project.prototype.require = function() {
      called = true;
      return function() {};
    };

    tmp.setup(path);

    touch(path + '/config/environment.js', {
      baseURL: '/foo/bar'
    });

    project = new Project(path, { });
  });

  after(function() {
    tmp.teardown(path);
  });

  it('config() finds and requires config/environment', function() {
    project.config('development');
    assert.equal(called, true);
  });
});
