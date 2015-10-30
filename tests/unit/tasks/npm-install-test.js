'use strict';

var expect     = require('chai').expect;
var MockUI     = require('../../helpers/mock-ui');
var NpmInstallTask = require('../../../lib/tasks/npm-install');

describe('npm install', function() {
  var ui;

  var loadCalledWith;
  var installCalledWith;

  var npm = {
    load: function(options, callback) {
      setTimeout(function() {
        callback(undefined, npm);
      }, 0);
      loadCalledWith = options;
    },
    commands: {
      install: function(args, callback) {
        setTimeout(callback, 0);
        installCalledWith = args;
      }
    }
  };

  beforeEach(function() {
    installCalledWith = loadCalledWith = undefined;
  });

  it('without arguments', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({}).then(function() {
      expect(ui.output).to.include('Installed packages for tooling via npm.');
      expect(installCalledWith).to.deep.equal([], 'No packages to install');

      expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
      expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
      expect(loadCalledWith.loglevel).to.equal('error', 'loglevel is error');
      expect(loadCalledWith.optional).to.equal(true, 'has an optional flag');
    });
  });


  it('with one package', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      packages: ['ember-data']
    }).then(function() {
      expect(ui.output).to.include('Installed packages for tooling via npm.');
      expect(installCalledWith).to.deep.equal(['ember-data'], 'called with ember-data');

      expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
      expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
      expect(loadCalledWith.loglevel).to.equal('error', 'loglevel is error');
      expect(loadCalledWith.optional).to.equal(true, 'has an optional flag');
    });
  });

  it('with several packages', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      packages: ['ember-data', 'torii'],
    }).then(function() {
      expect(ui.output).to.include('Installed packages for tooling via npm.');
      expect(installCalledWith).to.deep.equal(['ember-data', 'torii'], 'Called with both packages');

      expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
      expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
      expect(loadCalledWith.loglevel).to.equal('error', 'loglevel is error');
      expect(loadCalledWith.optional).to.equal(true, 'has an optional flag');
    });
  });

  it('with verbose', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      verbose: true,
    }).then(function() {
        expect(loadCalledWith.loglevel).to.equal('verbose', 'Loglevel is verbose');

        expect(loadCalledWith.optional).to.equal(true, 'has an optional flag');
        expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
        expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
        expect(installCalledWith).to.deep.equal([], 'No packages to install');
    });
  });

  it('with no optional', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      optional: false,
    }).then(function() {
        expect(loadCalledWith.optional).to.equal(false, 'is optional');

        expect(loadCalledWith.loglevel).to.equal('error', 'loglevel is error');
        expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
        expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
        expect(installCalledWith).to.deep.equal([], 'No packages to install');
    });
  });

  it('with save-dev but no packages specified', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      'save-dev': true
    }).then(function() {
        expect(loadCalledWith['save-dev']).to.equal(false, 'No save-dev flag');
    });
  });

  it('with save-dev', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      'save-dev': true,
      'packages': ['ember-watson']
    }).then(function() {
        expect(loadCalledWith['save-dev']).to.equal(true, 'save-dev flag passed');
    });
  });

  it('with save-exact but no packages specified', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      'save-exact': true
    }).then(function() {
        expect(loadCalledWith['save-exact']).to.equal(false, 'No save-exact flag');
    });
  });

  it('with save-exact', function() {
    ui = new MockUI();

    var task = new NpmInstallTask({
      ui: ui,
      npm: npm
    });

    return task.run({
      'save-exact': true,
      'packages': ['ember-watson']
    }).then(function() {
        expect(loadCalledWith['save-exact']).to.equal(true, 'save-exact flag passed');
    });
  });

});

