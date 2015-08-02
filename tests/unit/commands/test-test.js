'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var stub           = require('../../helpers/stub').stub;
var existsSync     = require('exists-sync');
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');
var CoreObject     = require('core-object');
var path           = require('path');
var fs             = require('fs');
var TestCommand    = require('../../../lib/commands/test');
var MockProject    = require('../../helpers/mock-project');

describe('test command', function() {
  var tasks;
  var options;
  var buildRun;
  var testRun;
  var testServerRun;

  beforeEach(function(){
    tasks = {
      Build: Task.extend(),
      Test: Task.extend(),
      TestServer: Task.extend()
    };

    var project = new MockProject();
    project.isEmberCLIProject = function() { return true; };
    options = commandOptions({
      tasks: tasks,
      testing: true,
      settings: {},
      project: project
    });

    stub(tasks.Test.prototype,  'run', Promise.resolve());
    stub(tasks.Build.prototype, 'run', Promise.resolve());

    buildRun = tasks.Build.prototype.run;
    testRun  = tasks.Test.prototype.run;

    stub(tasks.TestServer.prototype, 'run', Promise.resolve());
    testServerRun = tasks.TestServer.prototype.run;
  });

  it('builds and runs test', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
      expect(buildRun.called).to.equal(1, 'expected build task to be called once');
      expect(testRun.called).to.equal(1,  'expected test task to be called once');
    });
  });

  it('has the correct options', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
      var buildOptions = buildRun.calledWith[0][0];
      var testOptions  = testRun.calledWith[0][0];

      expect(buildOptions.environment).to.equal('test', 'has correct env');
      expect(buildOptions.outputPath,                   'has outputPath');
      expect(testOptions.configFile).to.equal('./testem.json', 'has config file');
      expect(testOptions.port).to.equal(7357, 'has config file');
    });
  });

  it('passes through custom configFile option', function() {
    return new TestCommand(options).validateAndRun(['--config-file=some-random/path.json']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.configFile).to.equal('some-random/path.json');
    });
  });

  it('does not pass any port options', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.port).to.equal(7357);
    });
  });

  it('passes through a custom test port option', function() {
    return new TestCommand(options).validateAndRun(['--test-port=5679']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.port).to.equal(5679);
    });
  });

  it('only passes through the port option', function() {
    return new TestCommand(options).validateAndRun(['--port=5678']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.port).to.equal(5679);
    });
  });

  it('passes both the port and the test port options', function() {
    return new TestCommand(options).validateAndRun(['--port=5678', '--test-port=5900']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.port).to.equal(5900);
    });
  });

  it('passes through custom host option', function() {
    return new TestCommand(options).validateAndRun(['--host=greatwebsite.com']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.host).to.equal('greatwebsite.com');
    });
  });

  it('passes through custom reporter option', function() {
    return new TestCommand(options).validateAndRun(['--reporter=xunit']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      expect(testOptions.reporter).to.equal('xunit');
    });
  });

  describe('--server option', function() {
    beforeEach(function() {
      options.Builder = CoreObject.extend();
      options.Watcher = CoreObject.extend();
    });

    it('builds a watcher with verbose set to false', function() {
      return new TestCommand(options).validateAndRun(['--server']).then(function() {
        var testOptions = testServerRun.calledWith[0][0];

        expect(testOptions.watcher.verbose, false);
      });
    });

    it('builds a watcher with options.watcher set to value provided', function() {
      return new TestCommand(options).validateAndRun(['--server', '--watcher=polling']).then(function() {
        var testOptions  = testServerRun.calledWith[0][0];

        expect(testOptions.watcher.options.watcher).to.equal('polling');
      });
    });
  });

  describe('_generateCustomConfigFile', function() {
    var command;
    var runOptions;
    var fixturePath;

    beforeEach(function() {
      fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'tasks', 'testem-config');
      command = new TestCommand(options);
      runOptions = {
        configFile: path.join(fixturePath, 'testem.json')
      };
    });

    afterEach(function() {
      command.rmTmp();
    });

    it('should return a valid path', function() {
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(existsSync(newPath));
    });

    it('should return the original path if options are not present', function() {
      var originalPath = runOptions.configFile;
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.equal(originalPath);
    });

    it('when options are present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      runOptions.launch = 'fooLauncher';
      runOptions['test-page'] = 'foo/test.html?foo';
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.not.equal(originalPath);
      expect(existsSync(newPath), 'file should exist');
    });

    it('when filter option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.not.equal(originalPath);
      expect(existsSync(newPath), 'file should exist');
    });

    it('when module option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.module = 'fooModule';
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.not.equal(originalPath);
      expect(existsSync(newPath), 'file should exist');
    });

    it('when launch option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.launch = 'fooLauncher';
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.not.equal(originalPath);
      expect(existsSync(newPath), 'file should exist');
    });

    it('when test-page option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions['test-page'] = 'foo/test.html?foo';
      var newPath = command._generateCustomConfigFile(runOptions);

      expect(newPath).to.not.equal(originalPath);
      expect(existsSync(newPath), 'file should exist');
    });

    it('when provided filter and module the new file returned contains the both option values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?module=fooModule&filter=bar');
    });

    it('when provided test-page the new file returned contains the value in test_page', function() {
      runOptions['test-page'] = 'foo/test.html?foo';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('foo/test.html?foo&');
    });

    it('when provided test-page with filter and module the new file returned contains those values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      runOptions['test-page'] = 'foo/test.html?foo';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('foo/test.html?foo&module=fooModule&filter=bar');
    });

    it('when provided launch the new file returned contains the value in launch', function() {
      runOptions.launch = 'fooLauncher';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['launch']).to.be.equal('fooLauncher');
    });

    it('when provided filter is all lowercase to match the test name', function() {
      runOptions.filter = 'BAR';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?filter=bar');
    });

    it('when module and filter option is present uses buildTestPageQueryString for test_page queryString', function() {
      runOptions.filter = 'bar';
      command.buildTestPageQueryString = function(options) {
        expect(options).to.deep.equal(runOptions);

        return 'blah=zorz';
      };

      var newPath = command._generateCustomConfigFile(runOptions);

      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?blah=zorz');
    });

    it('new file returned contains the filter option value in test_page', function() {
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?filter=foo');
    });

    it('adds with a `&` if query string contains `?` already', function() {
      runOptions.filter = 'foo';
      runOptions.configFile = path.join(fixturePath, 'testem-with-query-string.json');
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?hidepassed&filter=foo');
    });

    it('new file returned contains the module option value in test_page', function() {
      runOptions.module = 'fooModule';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      expect(contents['test_page']).to.be.equal('tests/index.html?module=fooModule');
    });
  });
});
