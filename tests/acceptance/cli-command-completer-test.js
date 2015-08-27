'use strict';

var expect      = require('chai').expect;
var Completer   = require('../../lib/models/cli-command-completer');

var completer;
describe('Acceptance: cli-command-completer', function() {

  before(function() {
    completer = new Completer();
  });

  it('has its completion property set', function() {
    expect(completer.completion).to.exist;
    expect(completer.completion.program).to.equal('ember');
  });

  it('has its template property set', function() {
    expect(completer.template).to.exist;
    expect(completer.template).to.deep.include.property('commands[0].name', 'ember');
  });

  it('correct intent', function() {
    var intent = {
      arguments: ['ember', 'generate'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'acceptance-test',
      'adapter',
      'adapter-test',
      'addon',
      'addon-import',
      'app',
      'blueprint',
      'component',
      'component-addon',
      'component-test',
      'controller',
      'controller-test',
      'helper',
      'helper-addon',
      'helper-test',
      'http-mock',
      'http-proxy',
      'in-repo-addon',
      'initializer',
      'initializer-addon',
      'initializer-test',
      'lib',
      'mixin',
      'mixin-test',
      'model',
      'model-test',
      'resource',
      'route',
      'route-addon',
      'route-test',
      'serializer',
      'serializer-test',
      'server',
      'service',
      'service-test',
      'template',
      'test-helper',
      'transform',
      'transform-test',
      'util',
      'util-test',
      'view',
      'view-test'
    );
  });

  it('nested intent', function() {
    var intent = {
      arguments: ['ember', 'help', 'generate'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'acceptance-test',
      'adapter',
      'adapter-test',
      'addon',
      'addon-import',
      'app',
      'blueprint',
      'component',
      'component-addon',
      'component-test',
      'controller',
      'controller-test',
      'helper',
      'helper-addon',
      'helper-test',
      'http-mock',
      'http-proxy',
      'in-repo-addon',
      'initializer',
      'initializer-addon',
      'initializer-test',
      'lib',
      'mixin',
      'mixin-test',
      'model',
      'model-test',
      'resource',
      'route',
      'route-addon',
      'route-test',
      'serializer',
      'serializer-test',
      'server',
      'service',
      'service-test',
      'template',
      'test-helper',
      'transform',
      'transform-test',
      'util',
      'util-test',
      'view',
      'view-test'
    );
  });

  it('incorrect intent', function() {
    var intent = {
      arguments: ['ember', 'asdf'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.be.empty;
  });

  it('premature correct intent', function() {
    var intent = {
      arguments: ['ember', 'gen'],
      isPremature: true,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'addon',
      'build',
      'destroy',
      'generate',
      'help',
      'init',
      'core-object',
      'core-object',
      'core-object',
      'install',
      'new',
      'serve',
      'test',
      'core-object',
      'core-object',
      'version'
    );
  });

  it('premature incorrect intent', function() {
    var intent = {
      arguments: ['ember', 'asdf'],
      isPremature: true,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'addon',
      'build',
      'destroy',
      'generate',
      'help',
      'init',
      'core-object',
      'core-object',
      'core-object',
      'install',
      'new',
      'serve',
      'test',
      'core-object',
      'core-object',
      'version'
    );
  });

  it('correct option intent', function() {
    var intent = {
      arguments: ['ember', 'generate', '--'],
      isPremature: true,
      seeksOptions: true,
    };

    expect(completer.getResult(intent)).to.contain.all(
      '--dry-run',
      '--verbose',
      '--pod',
      '--classic',
      '--dummy',
      '--in-repo-addon='
    );
  });

  it('nested option intent', function() {
    var intent = {
      arguments: ['ember', 'help', 'generate', '--'],
      isPremature: true,
      seeksOptions: true,
    };

    expect(completer.getResult(intent)).to.contain.all(
      '--dry-run',
      '--verbose',
      '--pod',
      '--classic',
      '--dummy',
      '--in-repo-addon='
    );
  });

  it('incorrect option intent', function() {
    var intent = {
      arguments: ['ember', 'asdf', '--'],
      isPremature: true,
      seeksOptions: true,
    };

    expect(completer.getResult(intent)).to.be.empty;
  });

  it('correct alias intent', function() {
    var intent = {
      arguments: ['ember', 'h'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'addon',
      'build',
      'destroy',
      'generate',
      'help',
      'init',
      'core-object',
      'core-object',
      'core-object',
      'install',
      'new',
      'serve',
      'test',
      'core-object',
      'core-object',
      'version'
    );
  });

  it('nested alias intent', function() {
    var intent = {
      arguments: ['ember', 'h', 'g'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.contain.all(
      'acceptance-test',
      'adapter',
      'adapter-test',
      'addon',
      'addon-import',
      'app',
      'blueprint',
      'component',
      'component-addon',
      'component-test',
      'controller',
      'controller-test',
      'helper',
      'helper-addon',
      'helper-test',
      'http-mock',
      'http-proxy',
      'in-repo-addon',
      'initializer',
      'initializer-addon',
      'initializer-test',
      'lib',
      'mixin',
      'mixin-test',
      'model',
      'model-test',
      'resource',
      'route',
      'route-addon',
      'route-test',
      'serializer',
      'serializer-test',
      'server',
      'service',
      'service-test',
      'template',
      'test-helper',
      'transform',
      'transform-test',
      'util',
      'util-test',
      'view',
      'view-test'
    );
  });

});
