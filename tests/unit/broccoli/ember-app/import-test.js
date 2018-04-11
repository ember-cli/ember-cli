'use strict';

const co = require('co');
const path = require('path');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const EmberApp = require('../../../../lib/broccoli/ember-app');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

const getDefaultUnpackagedDist = defaultPackagerHelpers.getDefaultUnpackagedDist;
const getDependencyFor = defaultPackagerHelpers.getDependencyFor;
const setupProject = defaultPackagerHelpers.setupProject;
const validateDefaultPackagedDist = defaultPackagerHelpers.validateDefaultPackagedDist;

describe('EmberApp: Bower Dependencies', function() {
  let applicationDirectory, output;

  let moment = getDependencyFor('moment', {
    'package.json': '{}',
    'moment.js': 'window.moment = "what does time even mean?";',
    'moment.min.js': 'window.moment = "verysmallmoment"',
  });

  beforeEach(co.wrap(function *() {
    applicationDirectory = yield createTempDir();
  }));

  afterEach(co.wrap(function *() {
    yield applicationDirectory.dispose();
    yield output.dispose();
  }));

  /*
   * Both Ember.js and jQuery are packaged by default (when distriburted
   * through bower). `ember-source` takes precedent over bower though.
   */
  it('are not packaged unless explicitly imported', co.wrap(function *() {
    // Given
    applicationDirectory.write(getDefaultUnpackagedDist('the-best-app-ever', {
      bowerComponents: Object.assign({}, moment),
    }));

    let applicationInstance = new EmberApp({
      name: 'the-best-app-ever',
      project: setupProject(
        path.join(applicationDirectory.path(), 'the-best-app-ever')
      ),
    });

    // When
    let packagedApplicationJs = applicationInstance._defaultPackager.packageJavascript(applicationDirectory.path());

    // Then
    output = yield buildOutput(packagedApplicationJs);
    let results = output.read();

    expect(() => {
      validateDefaultPackagedDist('the-best-app-ever', results);
    }).not.to.throw();
    expect(results.assets['vendor.js']).to.contain('window.Ember = {');
    expect(results.assets['vendor.js']).to.contain('window.$ = function() {');
    expect(results.assets['vendor.js']).to.not.contain('window.moment');
  }));

  it('are packaged when explicitly imported', co.wrap(function *() {
    // Given
    applicationDirectory.write(getDefaultUnpackagedDist('the-best-app-ever', {
      bowerComponents: Object.assign({}, moment),
    }));
    let applicationInstance = new EmberApp({
      name: 'the-best-app-ever',
      project: setupProject(
        path.join(applicationDirectory.path(), 'the-best-app-ever')
      ),
    });
    applicationInstance.import('bower_components/moment/moment.js');

    // When
    let packagedApplicationJs = applicationInstance._defaultPackager.packageJavascript(applicationDirectory.path());

    // Then
    output = yield buildOutput(packagedApplicationJs);
    let results = output.read();

    expect(() => {
      validateDefaultPackagedDist('the-best-app-ever', results);
    }).not.to.throw();
    expect(results.assets['vendor.js']).to.contain('window.Ember = {');
    expect(results.assets['vendor.js']).to.contain('window.$ = function() {');
    expect(results.assets['vendor.js']).to.contain('window.moment');
  }));

  it('are packaged when explicitly imported for production', co.wrap(function *() {
    // Given
    applicationDirectory.write(getDefaultUnpackagedDist('the-best-app-ever', {
      bowerComponents: Object.assign({}, moment),
    }));

    let applicationInstance = new EmberApp({
      name: 'the-best-app-ever',
      project: setupProject(
        path.join(applicationDirectory.path(), 'the-best-app-ever')
      ),
    });
    applicationInstance.env = 'production';
    applicationInstance.import({
      development: 'bower_components/moment/moment.js',
      production: 'bower_components/moment/moment.min.js',
    });

    // When
    let packagedApplicationJs = applicationInstance._defaultPackager.packageJavascript(applicationDirectory.path());

    // Then
    output = yield buildOutput(packagedApplicationJs);
    let results = output.read();

    expect(() => {
      validateDefaultPackagedDist('the-best-app-ever', results);
    }).not.to.throw();
    expect(results.assets['vendor.js']).to.contain('verysmallmoment');
  }));

  it('are packaged when explicitly imported for development', co.wrap(function *() {
    // Given
    applicationDirectory.write(getDefaultUnpackagedDist('the-best-app-ever', {
      bowerComponents: Object.assign({}, moment),
    }));
    let applicationInstance = new EmberApp({
      name: 'the-best-app-ever',
      project: setupProject(
        path.join(applicationDirectory.path(), 'the-best-app-ever')
      ),
    });
    applicationInstance.import({
      development: 'bower_components/moment/moment.js',
      production: 'bower_components/moment/moment.min.js',
    });

    // When
    let packagedApplicationJs = applicationInstance._defaultPackager.packageJavascript(applicationDirectory.path());

    // Then
    output = yield buildOutput(packagedApplicationJs);
    let results = output.read();

    expect(() => {
      validateDefaultPackagedDist('the-best-app-ever', results);
    }).not.to.throw();
    expect(results.assets['vendor.js']).to.contain('window.moment');
  }));
});
