'use strict';

const Task = require('../../../lib/models/task');
const AddonInstallTask = require('../../../lib/tasks/addon-install');
const expect = require('chai').expect;
const MockUi = require('console-ui/mock');

describe('addon install task', function () {
  let ui;
  let project;

  beforeEach(function () {
    ui = new MockUi();
    project = {
      reloadAddons() {},
    };
  });

  afterEach(function () {
    // ui.stopProgress();
    ui = undefined;
    project = undefined;
  });

  describe('when no save flag specified in blueprintOptions', function () {
    it('calls npm install with --save-dev as a default', function (done) {
      let MockNpmInstallTask = class extends Task {
        run(options) {
          expect(options.save).to.not.be.true;
          expect(options['save-dev']).to.be.true;
          done();
          return Promise.resolve();
        }
      };

      let addonInstallTask = new AddonInstallTask({
        ui,
        project,
        NpmInstallTask: MockNpmInstallTask,
      });

      addonInstallTask.run({});
    });
  });

  describe('when save flag specified in blueprintOptions', function () {
    it('calls npm install with --save', function (done) {
      let MockNpmInstallTask = class extends Task {
        run(options) {
          expect(options.save).to.be.true;
          expect(options['save-dev']).to.not.be.true;
          done();
          return Promise.resolve();
        }
      };

      let addonInstallTask = new AddonInstallTask({
        ui,
        project,
        NpmInstallTask: MockNpmInstallTask,
      });

      addonInstallTask.run({
        blueprintOptions: {
          save: true,
        },
      });
    });
  });

  describe('when saveDev flag specified in blueprintOptions', function () {
    it('calls npm install with --save-dev', function (done) {
      let MockNpmInstallTask = class extends Task {
        run(options) {
          expect(options.save).to.not.be.true;
          expect(options['save-dev']).to.be.true;
          done();
          return Promise.resolve();
        }
      };

      let addonInstallTask = new AddonInstallTask({
        ui,
        project,
        NpmInstallTask: MockNpmInstallTask,
      });

      addonInstallTask.run({
        blueprintOptions: {
          saveDev: true,
        },
      });
    });
  });

  describe('when both save and saveDev flag specified in blueprintOptions', function () {
    it('calls npm install with --save', function (done) {
      let MockNpmInstallTask = class extends Task {
        run(options) {
          expect(options.save).to.be.true;
          expect(options['save-dev']).to.not.be.true;
          done();
          return Promise.resolve();
        }
      };

      let addonInstallTask = new AddonInstallTask({
        ui,
        project,
        NpmInstallTask: MockNpmInstallTask,
      });

      addonInstallTask.run({
        blueprintOptions: {
          save: true,
          saveDev: true,
        },
      });
    });
  });
});
