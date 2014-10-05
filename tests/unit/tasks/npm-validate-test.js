'use strict';

var assert          = require('../../helpers/assert');
var MockUI          = require('../../helpers/mock-ui');
var NpmValidateTask = require('../../../lib/tasks/npm-validate');

describe('npm-validate', function() {
  var createTask = function(dependencies, devDependencies) {
    return new NpmValidateTask({
      ui: new MockUI(),
      project: {
        root: 'tests/fixtures/project-npm-validate',
        pkg: {
          dependencies: dependencies,
          devDependencies: devDependencies
        }
      }
    });
  };

  var error = 'The project has unsatisfied NPM dependencies';

  var assertResolved = function(task) {
    return task.run()
      .catch(function() {})
      .finally(function() {
        assert.notInclude(task.ui.output, error);
      });
  };

  var assertRejected = function(task) {
    var error = 'The project has unsatisfied NPM dependencies';
    return task.run()
      .catch(function() {})
      .finally(function() {
        assert.include(task.ui.output, error);
      });
  };

  describe('reports an error', function() {
    it('when the specified package is not installed', function() {
      var task = createTask({ 'foo': '0.1.1' }, { 'ember-cli': '1.2.3' });
      return assertRejected(task);
    });

    it('when the installed package does not match the version specified', function() {
      var task = createTask({ 'ember-cli': '0.1.1' });
      return assertRejected(task);
    });

    it('when the installed package does not satisfy the version range specified', function() {
      var task = createTask({ 'ember-cli': '>1.3.2 <=2.3.4' });
      return assertRejected(task);
    });

    it('when the installed package is not compatible with the version specified', function() {
      var task = createTask({ 'ember-cli': '0.2.x' });
      return assertRejected(task);
    });

    it('when the version specified is a Git repo with a semver tag and there is a version mismatch', function() {
      var task = createTask({ 'ember-cli': 'git://github.com/stefanpenner/ember-cli.git#v0.1.0' });
      return assertRejected(task);
    });
  });

  describe('does not report an error', function() {
    it('when the installed package matches the version specified', function() {
      var task = createTask({ 'ember-cli': '1.2.3' });
      return assertResolved(task);
    });

    it('when the installed package satisfies the version range specified', function() {
      var task = createTask({ 'ember-cli': '>1.0.0' });
      return assertResolved(task);
    });

    it('when the installed package is compatible with the version specified', function() {
      var task = createTask({ 'ember-cli': '^1.2.0' });
      return assertResolved(task);
    });

    it('when the version specified is a URL', function() {
      var task = createTask({ 'ember-cli': 'http://ember-cli.com/ember-cli.tar.gz' });
      return assertResolved(task);
    });

    it('when the version specified is a Git repo with a non-semver tag', function() {
      var task = createTask({ 'ember-cli': 'git://github.com/stefanpenner/ember-cli.git#master' });
      return assertResolved(task);
    });

    it('when the version specified is a local path', function() {
      var task = createTask({ 'ember-cli': '~/projects/ember-cli' });
      return assertResolved(task);
    });
  });
});
