'use strict';

var path          = require('path');
var tmp           = require('tmp-sync');
var expect        = require('chai').expect;
var ember         = require('../../helpers/ember');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var commandNames  = require('../../helpers/command-names');
var Promise       = require('../../../lib/ext/promise');
var pluck         = require('lodash/collection/pluck');
var remove        = Promise.denodeify(require('fs-extra').remove);
var root          = process.cwd();
var tmproot       = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('works', function() {
    return ember([
      'help',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      expect(json.name).to.equal('ember');
      expect(json.description).to.equal(null);
      expect(json.aliases).to.deep.equal([]);
      expect(json.availableOptions).to.deep.equal([]);
      expect(json.anonymousOptions).to.deep.equal(['<command (Default: help)>']);
      expect(pluck(json.commands, 'name')).to.deep.equal(commandNames);
      expect(json.addons).to.deep.equal([]);
    });
  });

  it('works with alias h', function() {
    return ember([
      'h',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      expect(json.name).to.equal('ember');
      expect(json.description).to.equal(null);
      expect(json.aliases).to.deep.equal([]);
      expect(json.availableOptions).to.deep.equal([]);
      expect(json.anonymousOptions).to.deep.equal(['<command (Default: help)>']);
      expect(pluck(json.commands, 'name')).to.deep.equal(commandNames);
      expect(json.addons).to.deep.equal([]);
    });
  });

  it('works with alias --help', function() {
    return ember([
      '--help',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      expect(json.name).to.equal('ember');
      expect(json.description).to.equal(null);
      expect(json.aliases).to.deep.equal([]);
      expect(json.availableOptions).to.deep.equal([]);
      expect(json.anonymousOptions).to.deep.equal(['<command (Default: help)>']);
      expect(pluck(json.commands, 'name')).to.deep.equal(commandNames);
      expect(json.addons).to.deep.equal([]);
    });
  });

  it('works with alias -h', function() {
    return ember([
      '-h',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      expect(json.name).to.equal('ember');
      expect(json.description).to.equal(null);
      expect(json.aliases).to.deep.equal([]);
      expect(json.availableOptions).to.deep.equal([]);
      expect(json.anonymousOptions).to.deep.equal(['<command (Default: help)>']);
      expect(pluck(json.commands, 'name')).to.deep.equal(commandNames);
      expect(json.addons).to.deep.equal([]);
    });
  });

  it('handles missing command', function() {
    return ember([
      'help',
      'asdf',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      expect(json.commands.length).to.equal(0);
    });
  });
});
