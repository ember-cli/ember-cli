'use strict';

var AddonInstallTask = require('../../../lib/tasks/addon-install');
var MockProject      = require('../../helpers/mock-project');
var expect           = require('chai').expect;
var CoreObject       = require('core-object');
var Promise          = require('rsvp').Promise;

describe('addon install task', function() {
  var ui;
  var project;

  beforeEach(function() {
    ui = {
      startProgress: function() {

      }
    };
  });

  afterEach(function() {
    // ui.stopProgress();
    ui = undefined;
    project = undefined;
  });

  describe('when no save flag specified in blueprintOptions', function() {
    it('calls npm install with --save-dev as a default', function() {
      var mockNpmInstallTask = CoreObject.extend({
        run: function(options) {
          expect(options.save).to.not.equal(true);
          expect(options['save-dev']).to.equal(true);
          return new Promise(function(resolve, reject) {
            resolve();
          });
        }
      });

      var addonInstallTask = new AddonInstallTask({
        ui: ui,
        project: project,
        NpmInstallTask: mockNpmInstallTask
      });

      addonInstallTask.run({});
    });
  });

  describe('when save flag specified in blueprintOptions', function() {
    it('calls npm install with --save', function() {
      var mockNpmInstallTask = CoreObject.extend({
        run: function(options) {
          expect(options.save).to.equal(true);
          expect(options['save-dev']).to.not.equal(true);
          return new Promise(function(resolve, reject) {
            resolve();
          });
        }
      });

      var addonInstallTask = new AddonInstallTask({
        ui: ui,
        project: project,
        NpmInstallTask: mockNpmInstallTask
      });

      addonInstallTask.run({
        blueprintOptions: {
          save: true
        }
      });
    });
  });

  describe('when saveDev flag specified in blueprintOptions', function() {
    it('calls npm install with --save-dev', function() {
      var mockNpmInstallTask = CoreObject.extend({
        run: function(options) {
          expect(options.save).to.not.equal(true);
          expect(options['save-dev']).to.equal(true);
          return new Promise(function(resolve, reject) {
            resolve();
          });
        }
      });

      var addonInstallTask = new AddonInstallTask({
        ui: ui,
        project: project,
        NpmInstallTask: mockNpmInstallTask
      });

      addonInstallTask.run({
        blueprintOptions: {
          saveDev: true
        }
      });
    });
  });

  describe('when both save and saveDev flag specified in blueprintOptions', function() {
    it('calls npm install with --save', function() {
      var mockNpmInstallTask = CoreObject.extend({
        run: function(options) {
          expect(options.save).to.equal(true);
          expect(options['save-dev']).to.not.equal(true);
          return new Promise(function(resolve, reject) {
            resolve();
          });
        }
      });

      var addonInstallTask = new AddonInstallTask({
        ui: ui,
        project: project,
        NpmInstallTask: mockNpmInstallTask
      });

      addonInstallTask.run({
        blueprintOptions: {
          save: true,
          saveDev: true
        }
      });
    });
  });
});
