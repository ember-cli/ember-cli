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

const APPLICATION_BLUEPRINT = {
  app: {
    'app.js': '',
  },
  'bower_components': {
    ember: {
      'ember.js': 'window.Ember = { foo: "bar"; };',
    },
    jquery: {
      dist: {
        'jquery.js': 'window.$ = function() { console.log("this is jQuery!"); };',
      },
    },
    moment: {
      'moment.js': 'window.moment = "what does time even mean?";',
      'moment.min.js': 'window.moment="verysmallmoment"',
    },
  },
  config: {
    'environment.js': `
      'use strict';
      module.exports = function(environment) {
        return {
          modulePrefix: 'app-import',
          environment,
        };
      };
    `,
  },
  'node_modules': {
    moment: {
      'package.json': '{}',
      'moment.js': 'window.moment = "what does time even mean?";',
      'moment.min.js': 'window.moment="verysmallmoment"',
    },
    '@scoped': {
      private: {
        'package.json': '{}',
        'index.js': 'window.secret = "sssshhhhh";',
      },
    },
  },
  'package.json': JSON.stringify({
    name: 'app-import',
    devDependencies: {
      'broccoli-asset-rev': '^2.4.5',
      'ember-ajax': '^3.0.0',
      'ember-cli': '~2.14.0-beta.1',
      'ember-cli-app-version': '^3.0.0',
      'ember-cli-babel': '^6.0.0',
      'ember-cli-dependency-checker': '^1.3.0',
      'ember-cli-eslint': '^3.0.0',
      'ember-cli-htmlbars': '^1.1.1',
      'ember-cli-htmlbars-inline-precompile': '^0.4.0',
      'ember-cli-inject-live-reload': '^1.4.1',
      'ember-cli-qunit': '^4.1.1',
      'ember-cli-shims': '^1.2.0',
      'ember-cli-sri': '^2.1.0',
      'ember-cli-uglify': '^2.0.0',
      'ember-data': '~2.13.0',
      'ember-export-application-global': '^2.0.0',
      'ember-load-initializers': '^1.0.0',
      'ember-resolver': '^4.0.0',
      'ember-source': '~2.14.0-beta.1',
      'ember-welcome-page': '^3.0.0',
      'loader.js': '^4.2.3',
    },
    engines: {
      node: '>= 4',
    },
    private: true,
  }),
};

describe('EmberApp.import()', function() {
  let input, cwd;

  before(co.wrap(function *() {
    cwd = process.cwd();

    input = yield createTempDir();
    input.write(APPLICATION_BLUEPRINT);
  }));

  after(co.wrap(function *() {
    process.chdir(cwd);
    yield input.dispose();
  }));

  function createApp(options) {
    options = options || {};

    let path = input.path();
    process.chdir(path);

    let pkg = fs.readJsonSync(`${path}/package.json`);

    let cli = new MockCLI();
    let project = new Project(path, pkg, cli.ui, cli);

    EmberApp.env = function() {
      return options.env || 'development';
    };

    let app = new EmberApp({
      project,
      _ignoreMissingLoader: true,
      sourcemaps: { enabled: false },
    }, options);

    app._processedTemplatesTree = () => '';
    app._compileAddonTemplates = tree => tree;

    return app;
  }

  it('does not import bower dependencies if they are not explicitly imported', co.wrap(function *() {
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
    let app = createApp({
      env: 'production',
    });

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
    let app = createApp();

    app.import('node_modules/moment/moment.js');
    app.import('node_modules/@scoped/private/index.js');

    let output = yield buildOutput(app.javascript());
    let outputTree = output.read();
    expect(Object.keys(outputTree)).to.deep.equal(['assets']);
    expect(Object.keys(outputTree['assets']).sort()).to.deep.equal(['app-import.js', 'vendor.js']);
    expect(outputTree['assets']['vendor.js']).to.contain('window.Ember = {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.$ = function() {');
    expect(outputTree['assets']['vendor.js']).to.contain('window.moment');
    expect(outputTree['assets']['vendor.js']).to.contain('window.secret');
  }));

  it('handles imports from node with different environments (development)', co.wrap(function *() {
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
    let app = createApp({
      env: 'production',
    });

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
