'use strict';

const Project = require('../../lib/models/project');
const Instrumentation = require('../../lib/models/instrumentation');
const MockUI = require('console-ui/mock');
const td = require('testdouble');

class MockProject extends Project {
  constructor() {
    let root = process.cwd();
    let pkg = {};
    let ui = new MockUI();
    let instr = new Instrumentation({
      ui,
      initInstrumentation: {
        token: null,
        node: null,
      },
    });
    let cli = {
      instrumentation: instr,
    };

    super(root, pkg, ui, cli);

    let discoverFromCli = td.replace(this.addonDiscovery, 'discoverFromCli');
    td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
  }

  require(file) {
    if (file === './server') {
      return function() {
        return {
          listen() { arguments[arguments.length - 1](); },
        };
      };
    }
  }

  config() {
    return this._config || {
      baseURL: '/',
      locationType: 'auto',
    };
  }

  has(key) {
    return (/server/.test(key));
  }

  name() {
    return 'mock-project';
  }

  hasDependencies() {
    return true;
  }

  dependencies() {
    return [];
  }

  isEmberCLIAddon() {
    return false;
  }
}

module.exports = MockProject;
