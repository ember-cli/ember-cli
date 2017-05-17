'use strict';

const co = require('co');
const fs = require('fs-extra');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const EmberApp = require('../../../../lib/broccoli/ember-app');
const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('EmberApp.import()', function() {
  let input, cwd;

  beforeEach(function() {
    cwd = process.cwd();
    return createTempDir().then(tempDir => (input = tempDir));
  });

  afterEach(function() {
    process.chdir(cwd);
    delete process.env.EMBER_ENV;
    return input.dispose();
  });

  function createApp(options) {
    options = options || {};

    let path = input.path();
    process.chdir(path);

    let pkg = fs.readJsonSync(`${path}/package.json`);

    let cli = new MockCLI();
    let project = new Project(path, pkg, cli.ui, cli);

    let app = new EmberApp({
      project,
      _ignoreMissingLoader: true,
      sourcemaps: { enabled: false },
    }, options);

    app._processedTemplatesTree = () => '';

    return app;
  }

  it('does not import bower dependencies if they are not explicitly imported', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'bower_components': {
        'moment': {
          'moment.js': 'window.moment = "what does time even mean?";',
        },
      },
    });

    let app = createApp();

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.Ember = {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.$ = function() {');
    expect(outputTree['assets']['vendor.js']).to.not.contain('window.moment');
  }));

  it('can import bower dependencies into vendor.js', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'bower_components': {
        'moment': {
          'moment.js': 'window.moment = "what does time even mean?";',
        },
      },
    });

    let app = createApp();

    app.import('bower_components/moment/moment.js');

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.Ember = {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.$ = function() {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.moment');
  }));

  it('handles imports with different environments (development)', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'bower_components': {
        'moment': {
          'moment.js': 'window.moment = "what does time even mean?";',
          'moment.min.js': 'window.moment="what does time even mean?"',
        },
      },
    });

    let app = createApp();

    app.import({
      development: 'bower_components/moment/moment.js',
      production: 'bower_components/moment/moment.min.js',
    });

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.moment = "');
  }));

  it('handles imports with different environments (production)', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'bower_components': {
        'moment': {
          'moment.js': 'window.moment = "what does time even mean?";',
          'moment.min.js': 'window.moment = "verysmallmoment"',
        },
      },
    });

    process.env.EMBER_ENV = 'production';

    let app = createApp();

    app.import({
      development: 'bower_components/moment/moment.js',
      production: 'bower_components/moment/moment.min.js',
    });

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('verysmallmoment');
  }));

  it('can import node dependencies into vendor.js', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'node_modules': {
        'moment': {
          'package.json': '{}',
          'moment.js': 'window.moment = "what does time even mean?";',
        },
      },
    });

    let app = createApp();

    app.import('node_modules/moment/moment.js');

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.Ember = {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.$ = function() {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.moment');
  }));

  it('handles imports from node with different environments (development)', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'node_modules': {
        'moment': {
          'package.json': '{}',
          'moment.js': 'window.moment = "what does time even mean?";',
          'moment.min.js': 'window.moment="what does time even mean?"',
        },
      },
    });

    let app = createApp();

    app.import({
      development: 'node_modules/moment/moment.js',
      production: 'node_modules/moment/moment.min.js',
    });

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.moment = "');
  }));

  it('handles imports from node with different environments (production)', co.wrap(function *() {
    input.copy(`${__dirname}/../../../fixtures/app-import`);
    input.write({
      'node_modules': {
        'moment': {
          'package.json': '{}',
          'moment.js': 'window.moment = "what does time even mean?";',
          'moment.min.js': 'window.moment = "verysmallmoment"',
        },
      },
    });

    process.env.EMBER_ENV = 'production';

    let app = createApp();

    app.import({
      development: 'node_modules/moment/moment.js',
      production: 'node_modules/moment/moment.min.js',
    });

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('verysmallmoment');
  }));
});
