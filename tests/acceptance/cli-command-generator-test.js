'use strict';

var fs          = require('fs');
var find        = require('lodash/collection/find');
var stub        = require('../helpers/stub').stub;
var expect      = require('chai').expect;
var Generator   = require('../../lib/models/cli-command-generator');

function byName(obj) {
  return obj.name;
}

var generator;

describe('Acceptance: cli-command-generator', function() {

  it('is fast', function() {
    var startMS = Date.now();
    generator = new Generator();
    generator.relPathToCache = '/foo.tmp';
    generator.run();
    var duration = Date.now() - startMS;
    fs.unlinkSync(process.cwd() + '/foo.tmp');
    expect(duration).to.be.lessThan(1000);
  });

  var result;
  describe('JSON generation', function() {

    before(function() {
      generator = new Generator();
      var root = generator.root;
      result = generator.generateJSON(root);
    });

    it('loads commands', function() {
      expect(generator.commands).to.not.be.empty;
      var names = generator.commands.map(byName);

      expect(names).to.include.all.members([
        'addon',
        'build',
        'destroy',
        'generate',
        'help',
        'init',
        'install',
        'new',
        'serve',
        'test',
        'version'
      ]);
    });

    it('loads blueprints', function() {
      expect(generator.blueprints).to.not.be.empty;
      var blueprintNames = generator.blueprints.map(byName);

      expect(blueprintNames).to.include.all.members([
        'acceptance-test',
        'adapter-test',
        'adapter',
        'addon-import',
        'addon',
        'app',
        'blueprint',
        'component-addon',
        'component-test',
        'component',
        'controller-test',
        'controller',
        'helper-addon',
        'helper-test',
        'helper',
        'http-mock',
        'http-proxy',
        'in-repo-addon',
        'initializer-addon',
        'initializer-test',
        'initializer',
        'lib',
        'mixin-test',
        'mixin',
        'model-test',
        'model',
        'resource',
        'route-addon',
        'route-test',
        'route',
        'serializer-test',
        'serializer',
        'server',
        'service-test',
        'service',
        'template',
        'test-helper',
        'transform-test',
        'transform',
        'util-test',
        'util',
        'view-test',
        'view'
      ]);
    });

    it('writes ember command as root', function() {
      expect(result.commands[0].name).to.equal('ember');
    });

    it('has an `ember` root with commands', function() {
      var root = generator.root;
      expect(root.name).to.equal('ember');
      expect(root.commands).to.not.be.empty;
    });

    it('writes subcommands of `ember`', function() {
      var names = result.commands[0].commands.map(byName);
      expect(names).to.include.all.members([
        'addon',
        'build',
        'destroy',
        'generate',
        'help',
        'init',
        'install',
        'new',
        'serve',
        'test',
        'version'
      ]);
    });

    it('ignores subcommands that skip help', function() {
      var names = result.commands[0].commands.map(byName);
      expect(names).to.not.include.members(['npm:install', 'install:addon']);
    });

    it('writes options of generate', function() {
      var generateCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'generate';
      });

      var podOption = find(generateCommand.options, function(option) {
        return option.name === 'pod';
      });

      var inRepoAddonOption = find(generateCommand.options, function(option) {
        return option.name === 'in-repo-addon';
      });

      expect(podOption.type).to.equal('Boolean');
      expect(inRepoAddonOption.type).to.equal('String');
    });

    it('writes aliases of generate', function() {
      var generateCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'generate';
      });

      expect(generateCommand.aliases).to.include('g');
    });

    it('writes subcommands of generate', function() {
      var generateCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'generate';
      });

      var names = generateCommand.commands.map(byName);

      expect(names).to.include.all.members([
        'acceptance-test',
        'adapter-test',
        'adapter',
        'addon-import',
        'addon',
        'app',
        'blueprint',
        'component-addon',
        'component-test',
        'component',
        'controller-test',
        'controller',
        'helper-addon',
        'helper-test',
        'helper',
        'http-mock',
        'http-proxy',
        'in-repo-addon',
        'initializer-addon',
        'initializer-test',
        'initializer',
        'lib',
        'mixin-test',
        'mixin',
        'model-test',
        'model',
        'resource',
        'route-addon',
        'route-test',
        'route',
        'serializer-test',
        'serializer',
        'server',
        'service-test',
        'service',
        'template',
        'test-helper',
        'transform-test',
        'transform',
        'util-test',
        'util',
        'view-test',
        'view'
      ]);
    });

    it('writes subcommands of destroy', function() {
      var destroyCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'destroy';
      });

      var names = destroyCommand.commands.map(byName);

      expect(names).to.include.all.members([
        'acceptance-test',
        'adapter-test',
        'adapter',
        'addon-import',
        'addon',
        'app',
        'blueprint',
        'component-addon',
        'component-test',
        'component',
        'controller-test',
        'controller',
        'helper-addon',
        'helper-test',
        'helper',
        'http-mock',
        'http-proxy',
        'in-repo-addon',
        'initializer-addon',
        'initializer-test',
        'initializer',
        'lib',
        'mixin-test',
        'mixin',
        'model-test',
        'model',
        'resource',
        'route-addon',
        'route-test',
        'route',
        'serializer-test',
        'serializer',
        'server',
        'service-test',
        'service',
        'template',
        'test-helper',
        'transform-test',
        'transform',
        'util-test',
        'util',
        'view-test',
        'view'
      ]);
    });

    it('writes subcommands of help', function() {
      var helpCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'help';
      });
      var names = helpCommand.commands.map(byName);
      expect(names).to.include.all.members([
        'addon',
        'build',
        'destroy',
        'generate',
        'help',
        'init',
        'install',
        'new',
        'serve',
        'test',
        'version'
      ]);
    });

    it('writes no subcommands for nested help', function() {
      var helpCommand = find(result.commands[0].commands, function(command) {
        return command.name === 'help';
      });
      var nestedHelpCommand = find(helpCommand.commands, function(command) {
        return command.name === 'help';
      });
      expect(nestedHelpCommand.commands.length).to.be.empty;
    });

  });

  describe('cache file access', function() {

    before(function() {
      generator = new Generator();
    });

    it('creates a cache file if non exists, and writes to it', function() {
      var generateJSON = stub(generator, 'generateJSON', 'moep');
      generator.relPathToCache = '/foo.tmp';
      generator.run();

      var exists = fs.existsSync(process.cwd() + '/foo.tmp');
      var content = fs.readFileSync(process.cwd() + '/foo.tmp', 'utf8');
      fs.unlinkSync(process.cwd() + '/foo.tmp');
      expect(exists).to.be.ok;
      expect(content).to.equal('"moep"');
      generateJSON.restore;
    });

    it('writes to a pre existing cache file', function() {
      fs.openSync(process.cwd() + '/baz.tmp', 'w');
      fs.writeFileSync(process.cwd() + '/baz.tmp', 'asdf');
      var generator = new Generator();
      var generateJSON = stub(generator, 'generateJSON', 'moep');
      generator.relPathToCache = '/baz.tmp';
      generator.run();

      var content = fs.readFileSync(process.cwd() + '/baz.tmp', 'utf8');
      fs.unlinkSync(process.cwd() + '/baz.tmp');
      expect(content).to.equal('"moep"');
      generateJSON.restore;
    });
  });

  describe('shell completion', function() {

    before(function() {
      generator = new Generator();
    });

    var setupBashConfig, setupZshConfig;
    describe('setup', function() {

      beforeEach(function() {
        generator = new Generator();
        setupBashConfig = stub(generator, 'setupBashConfig');
        setupZshConfig = stub(generator, 'setupZshConfig');
      });

      it('for bash users', function() {
        generator.setupShellConfig('path/to/.bash_profile');

        expect(setupBashConfig.called).to.equal(1);
        expect(setupBashConfig.calledWith[0][0]).to.equal('path/to/.bash_profile');
        expect(setupZshConfig.called).to.equal(0);
      });

      it('for zsh users', function() {
        generator.setupShellConfig('path/to/.zshrc');

        expect(setupZshConfig.called).to.equal(1);
        expect(setupZshConfig.calledWith[0][0]).to.equal('path/to/.zshrc');
        expect(setupBashConfig.called).to.equal(0);
      });
    });

    it('gets the users shell config path', function() {
      var shellMatch = process.env.SHELL.match(/bash|zsh/);
      var path = generator.getShellConfigPath();

      if (shellMatch) {
        var type = shellMatch[0];
        expect(path).to.be.ok;
        expect(path.match(type)).to.exist;
      } else {
        expect(false, 'current shell: ' + process.env.SHELL + 'is not known');
      }
    });

    it('sets up shell config file for the first time', function(done) {
      generator = new Generator();
      stub(generator, 'getShellConfigPath', process.cwd() + '/shell-path.tmp');
      var setupShellConfig = stub(generator, 'setupShellConfig');
      fs.openSync(process.cwd() + '/shell-path.tmp', 'w');
      fs.writeFile(process.cwd() + '/shell-path.tmp', 'asdf', function() {
        generator.setupShellCompletion();

        fs.unlinkSync(process.cwd() + '/shell-path.tmp');
        expect(setupShellConfig.called).to.equal(1);
        done();
      });
    });

    it('does not set up shell config file multiple times', function(done) {
      stub(generator, 'getShellConfigPath', process.cwd() + '/shell-path.tmp');
      var setupShellConfig = stub(generator, 'setupShellConfig');
      fs.openSync(process.cwd() + '/shell-path.tmp', 'w');
      fs.writeFile(process.cwd() + '/shell-path.tmp', '# begin ember completion', function() {
        generator.setupShellCompletion();

        fs.unlinkSync(process.cwd() + '/shell-path.tmp');
        expect(setupShellConfig.called).to.equal(0);
        done();
      });
    });
  });

});
