'use strict';

var fs          = require('fs');
var stub        = require('../../helpers/stub').stub;
var expect      = require('chai').expect;
var Generator   = require('../../../lib/models/cli-command-generator');
var MockProject = require('../../helpers/mock-project');

// unit test names
// unit test options
// unit test aliases
// unit test commands

var generator;

describe('Unit: cli-command-generator', function() {

  it('returns a generator object', function() {
    generator = new Generator();
    expect(generator.constructor).to.equal(Generator);
  });

  it('assumes closest project if none is given', function() {
    generator = new Generator();
    expect(generator.project).to.exist;
  });

  it('reloads addons for given project', function() {
    var project = new MockProject();
    stub(project, 'blueprintLookupPaths', []);
    var reloadAddons = stub(project, 'reloadAddons');
    generator = new Generator(project);
    expect(reloadAddons.called).to.equal(1);
  });

  it('appends to zsh config file', function() {
    generator = new Generator();
    fs.openSync(process.cwd() + '/.zsh-config.tmp', 'w');
    generator.setupZshConfig(process.cwd() + '/.zsh-config.tmp');
    var content = fs.readFileSync(process.cwd() + '/.zsh-config.tmp', 'utf8');
    fs.unlink(process.cwd() + '/.zsh-config.tmp', 'utf8');
    expect(content).to.match(/ember --completion/);
  });

  it('appends to bash config file', function() {
    generator = new Generator();
    fs.openSync(process.cwd() + '/.bash-config.tmp', 'w');
    generator.setupBashConfig(process.cwd() + '/.bash-config.tmp');
    var content = fs.readFileSync(process.cwd() + '/.bash-config.tmp', 'utf8');
    fs.unlink(process.cwd() + '/.bash-config.tmp', 'utf8');
    expect(content).to.match(/.ember\/completion\.sh/);
  });

});
