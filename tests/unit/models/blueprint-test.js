'use strict';

const fs = require('fs-extra');
const processHelpString = require('../../helpers/process-help-string');
const expect = require('chai').expect;
const path = require('path');
const EOL = require('os').EOL;
const proxyquire = require('proxyquire');
const existsSync = require('exists-sync');
const MarkdownColor = require('../../../lib/utilities/markdown-color');
const assign = require('ember-cli-lodash-subset').assign;
const td = require('testdouble');

let existsSyncStub;
let readdirSyncStub;
let forEachWithPropertyStub;
let Blueprint = proxyquire('../../../lib/models/blueprint', {
  'exists-sync'() {
    return existsSyncStub.apply(this, arguments);
  },
  'fs-extra': {
    readdirSync() {
      return readdirSyncStub.apply(this, arguments);
    },
  },
  '../utilities/printable-properties': {
    blueprint: {
      forEachWithProperty() {
        return forEachWithPropertyStub.apply(this, arguments);
      },
    },
  },
});

describe('Blueprint', function() {
  beforeEach(function() {
    existsSyncStub = existsSync;
    readdirSyncStub = fs.readdirSync;
  });

  afterEach(function() {
    td.reset();
  });

  describe('.mapFile', function() {
    it('replaces all occurences of __name__ with module name', function() {
      let path = Blueprint.prototype.mapFile('__name__/__name__-controller.js', { dasherizedModuleName: 'my-blueprint' });
      expect(path).to.equal('my-blueprint/my-blueprint-controller.js');

      path = Blueprint.prototype.mapFile('__name__/controller.js', { dasherizedModuleName: 'my-blueprint' });
      expect(path).to.equal('my-blueprint/controller.js');

      path = Blueprint.prototype.mapFile('__name__/__name__.js', { dasherizedModuleName: 'my-blueprint' });
      expect(path).to.equal('my-blueprint/my-blueprint.js');
    });

    it('accepts locals.fileMap with multiple mappings', function() {
      let locals = {};
      locals.fileMap = {
        __name__: 'user',
        __type__: 'controller',
        __path__: 'pods/users',
        __plural__: '',
      };

      let path = Blueprint.prototype.mapFile('__name__/__type____plural__.js', locals);
      expect(path).to.equal('user/controller.js');

      path = Blueprint.prototype.mapFile('__path__/__name__/__type__.js', locals);
      expect(path).to.equal('pods/users/user/controller.js');
    });
  });

  describe('.list', function() {
    beforeEach(function() {
      existsSyncStub = function(path) {
        return path.indexOf('package.json') === -1;
      };

      td.replace(Blueprint, 'defaultLookupPaths');
      td.when(Blueprint.defaultLookupPaths()).thenReturn([]);

      td.replace(Blueprint, 'load', function(blueprintPath) {
        return {
          name: path.basename(blueprintPath),
        };
      });
    });

    it('returns a list of blueprints grouped by lookup path', function() {
      readdirSyncStub = function() {
        return ['test1', 'test2'];
      };

      let list = Blueprint.list({ paths: ['test0/blueprints'] });

      expect(list[0]).to.deep.equal({
        source: 'test0',
        blueprints: [
          {
            name: 'test1',
            overridden: false,
          },
          {
            name: 'test2',
            overridden: false,
          },
        ],
      });
    });

    it('overrides a blueprint of the same name from another package', function() {
      readdirSyncStub = function() {
        return ['test2'];
      };

      let list = Blueprint.list({
        paths: [
          'test0/blueprints',
          'test1/blueprints',
        ],
      });

      expect(list[0]).to.deep.equal({
        source: 'test0',
        blueprints: [
          {
            name: 'test2',
            overridden: false,
          },
        ],
      });
      expect(list[1]).to.deep.equal({
        source: 'test1',
        blueprints: [
          {
            name: 'test2',
            overridden: true,
          },
        ],
      });
    });
  });

  describe('help', function() {
    let blueprint;

    beforeEach(function() {
      blueprint = new Blueprint('path/to/my-blueprint');
    });

    describe('printBasicHelp', function() {
      beforeEach(function() {
        td.replace(blueprint, '_printCommand', td.function());
        td.replace(blueprint, 'printDetailedHelp', td.function());
        td.when(blueprint.printDetailedHelp(), { ignoreExtraArgs: true }).thenReturn('help in detail');
      });

      it('handles overridden', function() {
        assign(blueprint, {
          overridden: true,
        });

        let output = blueprint.printBasicHelp();

        let testString = processHelpString('\
      \u001b[90m(overridden) my-blueprint\u001b[39m');

        expect(output).to.equal(testString);

        td.verify(blueprint._printCommand(), { times: 0 });
      });

      it('calls printCommand', function() {
        td.when(blueprint._printCommand(), { ignoreExtraArgs: true }).thenReturn(' command printed');

        let output = blueprint.printBasicHelp();

        let testString = processHelpString('\
      my-blueprint command printed');

        expect(output).to.equal(testString);
      });

      it('prints detailed help if verbose', function() {
        td.when(blueprint._printCommand(), { ignoreExtraArgs: true }).thenReturn(' command printed');

        let availableOptions = [];
        assign(blueprint, {
          availableOptions,
        });

        let output = blueprint.printBasicHelp(true);

        let testString = processHelpString(`\
      my-blueprint command printed${EOL}\
help in detail`);

        expect(output).to.equal(testString);
      });
    });

    describe('printDetailedHelp', function() {
      it('did not find the file', function() {
        existsSyncStub = function() {
          return false;
        };

        td.replace(MarkdownColor.prototype, 'renderFile');

        let help = blueprint.printDetailedHelp();
        expect(help).to.equal('');

        td.verify(MarkdownColor.prototype.renderFile(), { ignoreExtraArgs: true, times: 0 });
      });

      it('found the file', function() {
        existsSyncStub = function() {
          return true;
        };

        td.replace(MarkdownColor.prototype, 'renderFile', function() {
          expect(arguments[1].indent).to.equal('        ');
          return 'test-file';
        });

        let help = blueprint.printDetailedHelp();

        expect(help).to.equal('test-file');
      });
    });

    describe('getJson', function() {
      beforeEach(function() {
        forEachWithPropertyStub = function(forEach, context) {
          ['test1', 'availableOptions'].forEach(forEach, context);
        };
      });

      it('iterates options', function() {
        let availableOptions = [{
          type: 'my-string-type',
          showAnything: true,
        }, {
          type: function myFunctionType() {},
        }];

        assign(blueprint, {
          test1: 'a test',
          availableOptions,
        });

        let json = blueprint.getJson();

        expect(json).to.deep.equal({
          test1: 'a test',
          availableOptions: [
            {
              type: 'my-string-type',
              showAnything: true,
            },
            {
              type: 'myFunctionType',
            },
          ],
        });
      });

      it('does not print detailed if not verbose', function() {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        blueprint.getJson();

        td.verify(blueprint.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
      });

      it('is calling printDetailedHelp with availableOptions', function() {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        let availableOptions = [];
        assign(blueprint, {
          availableOptions,
        });

        blueprint.getJson(true);

        td.verify(blueprint.printDetailedHelp(availableOptions));
      });

      it('if printDetailedHelp returns falsy, don\'t attach property detailedHelp', function() {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        let json = blueprint.getJson(true);

        td.verify(blueprint.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
        expect(json).to.not.have.property('detailedHelp');
      });

      it('sets detailedHelp properly', function() {
        td.replace(blueprint, 'printDetailedHelp', td.function());
        td.when(blueprint.printDetailedHelp(), { ignoreExtraArgs: true }).thenReturn('some details');

        let json = blueprint.getJson(true);

        expect(json.detailedHelp).to.equal('some details');
      });
    });
  });
});
