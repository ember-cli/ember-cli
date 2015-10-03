'use strict';

var expect     = require('chai').expect;
var MockUI     = require('../../helpers/mock-ui');
var BowerInstallTask = require('../../../lib/tasks/bower-install');
var bower;

describe('bower install task', function() {
  var ui;

  var installCalledWithArgs, installCalledWithOptions, installCalled;

  var Bower = function() {
    // auto resolved on 'end' event with reject
    this.on = function(eventName, callback) {
      if (eventName === 'end') {
        callback(this);
      } else if (eventName === 'log') {
        callback({
          id: 'bower-message-id',
          message: 'logged message',
          level: 'info'
        });
      }
      return this;
    }.bind(this);

    var installCommand = function(args, options) {
      installCalled = true;
      installCalledWithArgs = args;
      installCalledWithOptions = options;
      return this;
    }.bind(this);

    return {
      on: this.on,
      commands: {
        install: installCommand
      }
    };
  };

  beforeEach(function() {
    installCalled = false;
    installCalledWithArgs = undefined;
    installCalledWithOptions = undefined;
    bower = new Bower();
  });

  it('without arguments', function() {
    ui = new MockUI();

    var expectedArgs  = [];
    var expectedOptions  = {
      verbose: false
    };

    var task = new BowerInstallTask({
      ui: ui,
      bower: bower
    });

    return task.run({}).then(function() {
      expect(ui.output).to.include('Installed browser packages via Bower.');

      // @todo: should be an empty array
      expect(installCalledWithArgs).to.deep.equal(expectedArgs);
      expect(installCalledWithOptions).to.deep.equal(expectedOptions);
    });
  });

  it('with packages', function() {
    ui = new MockUI();

    var expectedArgs  = ['ember'];
    var expectedOptions  = {
      save: true,
      verbose: false
    };

    var task = new BowerInstallTask({
      ui: ui,
      bower: bower
    });

    return task.run({
      packages: ['ember']
    }).then(function() {
      expect(ui.output).to.include('Installed browser packages via Bower.');

      expect(installCalledWithArgs).to.deep.equal(expectedArgs);
      expect(installCalledWithOptions).to.deep.equal(expectedOptions);
    });
  });
});

