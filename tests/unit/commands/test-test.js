'use strict';

const path = require('path');
const CoreObject = require('core-object');
const expect = require('../../chai').expect;
const MockProject = require('../../helpers/mock-project');
const commandOptions = require('../../factories/command-options');
const Promise = require('rsvp').Promise;
const Task = require('../../../lib/models/task');
const TestCommand = require('../../../lib/commands/test');
const td = require('testdouble');
const ci = require('ci-info');

describe('test command', function() {
  this.timeout(30000);

  let tasks, options, command;

  beforeEach(function() {
    tasks = {
      Build: Task.extend(),
      Test: Task.extend(),
      TestServer: Task.extend(),
    };

    let project = new MockProject();

    project.isEmberCLIProject = function() { return true; };

    options = commandOptions({
      tasks,
      testing: true,
      project,
    });

    td.replace(tasks.Test.prototype, 'run', td.function());
    td.replace(tasks.Build.prototype, 'run', td.function());
    td.replace(tasks.TestServer.prototype, 'run', td.function());
    td.when(tasks.Test.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenReturn(Promise.resolve());
    td.when(tasks.Build.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenReturn(Promise.resolve());
    td.when(tasks.TestServer.prototype.run(), { ignoreExtraArgs: true }).thenReturn(Promise.resolve());
  });

  afterEach(function() {
    td.reset();
  });

  function buildCommand() {
    command = new TestCommand(options);
  }

  describe('default', function() {
    beforeEach(function() {
      buildCommand();
    });

    it('builds and runs test', function() {
      return command.validateAndRun([]);
    });

    it('has the correct options', function() {
      return command.validateAndRun([]).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Build.prototype.run(captor.capture()));
        expect(captor.value.environment).to.equal('test', 'has correct env');
        expect(captor.value.outputPath, 'has outputPath').to.be.ok;

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.configFile).to.equal(undefined, 'does not supply config file when not specified');
        expect(captor.value.port).to.equal(7357, 'has config file');
      });
    });

    it('passes through custom configFile option', function() {
      return command.validateAndRun(['--config-file=some-random/path.json']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.configFile).to.equal('some-random/path.json');
      });
    });

    it('does not pass any port options', function() {
      return command.validateAndRun([]).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.port).to.equal(7357);
      });
    });

    it('passes through a custom test port option', function() {
      return command.validateAndRun(['--test-port=5679']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.port).to.equal(5679);
      });
    });

    it('passes through a custom test port option of 0 to allow OS to choose open system port', function() {
      return command.validateAndRun(['--test-port=0']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.port).to.equal(0);
      });
    });

    it('only passes through the port option', function() {
      return command.validateAndRun(['--port=5678']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.port).to.equal(5679);
      });
    });

    it('passes both the port and the test port options', function() {
      return command.validateAndRun(['--port=5678', '--test-port=5900']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.port).to.equal(5900);
      });
    });

    it('passes through custom host option', function() {
      return command.validateAndRun(['--host=greatwebsite.com']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.host).to.equal('greatwebsite.com');
      });
    });

    it('passes through custom reporter option', function() {
      return command.validateAndRun(['--reporter=xunit']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Test.prototype.run(captor.capture()));
        expect(captor.value.reporter).to.equal('xunit');
      });
    });

    (ci.APPVEYOR ? it.skip : it)('has the correct options when called with a build path and does not run a build task', function() {
      return command.validateAndRun(['--path=tests']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.Build.prototype.run(td.matchers.anything()), { times: 0 });
        td.verify(tasks.Test.prototype.run(captor.capture()));

        expect(captor.value.outputPath).to.equal(path.resolve('tests'), 'has outputPath');
        expect(captor.value.configFile).to.equal(undefined, 'does not include configFile when not specified in options');
        expect(captor.value.port).to.equal(7357, 'has port');
      });
    });

    it('throws an error if the build path does not exist', function() {
      return expect(command.validateAndRun(['--path=bad/path/to/build'])).to.be.rejected.then(error => {
        let expectedPath = path.resolve('bad/path/to/build');
        expect(error.message).to.equal(`The path ${expectedPath} does not exist. Please specify a valid build directory to test.`);
      });
    });
  });

  describe('--server option', function() {
    let buildCleanupWasCalled;
    beforeEach(function() {
      buildCleanupWasCalled = false;
      options.Builder = CoreObject.extend({
        cleanup() {
          buildCleanupWasCalled = true;
        },
      });
      options.Watcher = CoreObject.extend();

      buildCommand();
    });

    it('builds a watcher with verbose set to false', function() {
      return command.validateAndRun(['--server']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.TestServer.prototype.run(captor.capture()));
        expect(captor.value.watcher.verbose).to.be.false;
      }).finally(function() {
        expect(buildCleanupWasCalled).to.be.true;
      });
    });

    it('builds a watcher with options.watcher set to value provided', function() {
      return command.validateAndRun(['--server', '--watcher=polling']).then(function() {
        let captor = td.matchers.captor();

        td.verify(tasks.TestServer.prototype.run(captor.capture()));
        expect(captor.value.watcher.options.watcher).to.equal('polling');
      }).finally(function() {
        expect(buildCleanupWasCalled).to.be.true;
      });
    });

    it('DOES NOT throw an error if using a build path', function() {
      expect(command.validateAndRun(['--server', '--path=tests'])).to.be.ok;
    });
  });

  describe('_generateCustomConfigs', function() {
    let runOptions;

    beforeEach(function() {
      buildCommand();
      runOptions = {};
    });

    it('should return an object even if passed param is empty object', function() {
      let result = command._generateCustomConfigs(runOptions);
      expect(result).to.be.an('object');
    });

    it('when launch option is present, should be reflected in returned config', function() {
      runOptions.launch = 'fooLauncher';
      let result = command._generateCustomConfigs(runOptions);

      expect(result.launch).to.equal('fooLauncher');
    });

    it('when query option is present, should be reflected in returned config', function() {
      runOptions.query = 'someQuery=test';
      let result = command._generateCustomConfigs(runOptions);

      expect(result.queryString).to.equal(runOptions.query);
    });

    it('when provided test-page the new file returned contains the value in test_page', function() {
      runOptions['test-page'] = 'foo/test.html?foo';
      let result = command._generateCustomConfigs(runOptions);

      expect(result.testPage).to.be.equal('foo/test.html?foo&');
    });

    it('when provided test-page with filter, module, and query the new file returned contains those values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      runOptions.query = 'someQuery=test';
      runOptions['test-page'] = 'foo/test.html?foo';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('foo/test.html?foo&module=fooModule&filter=bar&someQuery=test');
    });

    it('when provided test-page with filter and module the new file returned contains both option values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      runOptions['test-page'] = 'foo/test.html?foo';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('foo/test.html?foo&module=fooModule&filter=bar');
    });

    it('when provided test-page with filter and query the new file returned contains both option values in test_page', function() {
      runOptions.query = 'someQuery=test';
      runOptions.filter = 'bar';
      runOptions['test-page'] = 'foo/test.html?foo';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('foo/test.html?foo&filter=bar&someQuery=test');
    });

    it('when provided test-page with module and query the new file returned contains both option values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.query = 'someQuery=test';
      runOptions['test-page'] = 'foo/test.html?foo';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('foo/test.html?foo&module=fooModule&someQuery=test');
    });

    it('when provided launch the new file returned contains the value in launch', function() {
      runOptions.launch = 'fooLauncher';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents['launch']).to.be.equal('fooLauncher');
    });

    it('when provided filter is all lowercase to match the test name', function() {
      runOptions['test-page'] = 'tests/index.html';
      runOptions.filter = 'BAR';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?filter=bar');
    });

    it('when module and filter option is present uses buildTestPageQueryString for test_page queryString', function() {
      runOptions.filter = 'bar';
      runOptions['test-page'] = 'tests/index.html';
      command.buildTestPageQueryString = function(options) {
        expect(options).to.deep.equal(runOptions);

        return 'blah=zorz';
      };

      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?blah=zorz');
    });

    it('new file returned contains the filter option value in test_page', function() {
      runOptions.filter = 'foo';
      runOptions['test-page'] = 'tests/index.html';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?filter=foo');
    });

    it('adds with a `&` if query string contains `?` already', function() {
      runOptions.filter = 'foo';
      runOptions['test-page'] = 'tests/index.html?hidepassed';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?hidepassed&filter=foo');
    });

    it('new file returned contains the module option value in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions['test-page'] = 'tests/index.html';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?module=fooModule');
    });

    it('new file returned contains the query option value in test_page', function() {
      runOptions.query = 'someQuery=test';
      runOptions['test-page'] = 'tests/index.html';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?someQuery=test');
    });

    it('new file returned contains the query option value with multiple queries in test_page', function() {
      runOptions.query = 'someQuery=test&something&else=false';
      runOptions['test-page'] = 'tests/index.html';
      let contents = command._generateCustomConfigs(runOptions);

      expect(contents.testPage).to.be.equal('tests/index.html?someQuery=test&something&else=false');
    });
  });
});
