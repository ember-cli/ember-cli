'use strict';

require('chai').use(require('chai-as-promised'));

var expect    = require('chai').expect;
var loadTasks = require('../../../lib/cli/load-tasks');

describe('cli/load-tasks.js', function() {
  it('loadTasks() should find basic tasks.', function() {
    return expect(loadTasks()).to.eventually.include.keys([
        'npmInstall'
      ]);
  });

  it('loadTasks() should fill out optional fields.', function() {
    return loadTasks()
      .then(function(tasks) {
        expect(tasks.npmInstall).to.include({
          name: 'npm-install',
          key: 'npmInstall'
        });
      });
  });
});
