'use strict';

const processHelpString = require('../../helpers/process-help-string');
const { expect } = require('chai');
const path = require('path');
const EOL = require('os').EOL;
const MarkdownColor = require('../../../lib/utilities/markdown-color');
const td = require('testdouble');

let Blueprint = require('../../../lib/models/blueprint');

describe('Blueprint', function () {
  afterEach(function () {
    td.reset();
  });

  describe('.removeTypes', function () {
    it('returns input when passing javascript', async function () {
      const output = await Blueprint.prototype.removeTypes('.js', 'const x = 1;\n');
      expect(output).to.equal('const x = 1;\n');
    });

    it('strips types when converting ts', async function () {
      const output = await Blueprint.prototype.removeTypes('.ts', 'const x: number = 1;\n');
      expect(output).to.equal('const x = 1;\n');
    });

    it('strips types when converting gts', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        'const x: number = 1;\n<template>Hello {{x}}!</template>\n'
      );
      expect(output).to.equal('const x = 1;\n<template>Hello {{x}}!</template>\n');
    });

    it('keeps imports used in templates when converting gts', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        `import { foo } from 'foo';
import type { Bar } from 'bar';

const bar: Bar = 'bar';

<template>{{foo}} {{bar}}</template>
`
      );
      expect(output).to.equal(`import { foo } from 'foo';

const bar = 'bar';

<template>{{foo}} {{bar}}</template>
`);
    });

    it('can handle template-only gts', async function () {
      const output = await Blueprint.prototype.removeTypes('.gts', '<template>Hello!</template>\n');
      expect(output).to.equal('<template>Hello!</template>\n');
    });

    it('can handle template-only gts with type signatures', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        `import type { TOC } from '@ember/component/template-only';

export interface FooSignature {
  // The arguments accepted by the component
  Args: {};
  // Any blocks yielded by the component
  Blocks: {
    default: []
  };
  // The element to which \`...attributes\` is applied in the component template
  Element: null;
}

<template>
  {{yield}}
</template> satisfies TOC<FooSignature>;
`
      );
      expect(output).to.equal('<template>\n  {{yield}}\n</template>\n');
    });

    it('can handle multi-line template tag', async function () {
      const output = await Blueprint.prototype.removeTypes('.gts', '<template>\nHello!\n</template>\n');
      expect(output).to.equal('<template>\nHello!\n</template>\n');
    });

    it('can handle multiple template tags in one file', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        'const x = <template>Hello!</template>\nconst y = <template>World!</template>\n'
      );
      expect(output).to.equal('const x = <template>Hello!</template>\nconst y = <template>World!</template>\n');
    });

    it('works in class body', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        'const foo: number = 1;\nexport default class Bar extends Component {\n  <template>Hello {{foo}}</template>\n}\n'
      );
      expect(output).to.equal(
        'const foo = 1;\nexport default class Bar extends Component {\n  <template>Hello {{foo}}</template>\n}\n'
      );
    });

    it('can handle multi-byte characters', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        "const x: string = '💩';\n<template>Hello {{x}}!</template>\n"
      );
      expect(output).to.equal("const x = '💩';\n<template>Hello {{x}}!</template>\n");
    });

    it('can handle template tags as function argument', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        'await render(<template>Hello {{foo}}</template>);\n'
      );
      expect(output).to.equal('await render(<template>Hello {{foo}}</template>);\n');
    });

    it('can handle template tags as function argument, including newlines', async function () {
      const output = await Blueprint.prototype.removeTypes(
        '.gts',
        'await render(\n  <template>Hello {{foo}}</template>\n);\n'
      );
      expect(output).to.equal('await render(<template>Hello {{foo}}</template>);\n');
    });
  });

  describe('.mapFile', function () {
    it('replaces all occurrences of __name__ with module name', function () {
      let path = Blueprint.prototype.mapFile('__name__/__name__-controller.js', {
        dasherizedModuleName: 'my-blueprint',
      });
      expect(path).to.equal('my-blueprint/my-blueprint-controller.js');

      path = Blueprint.prototype.mapFile('__name__/controller.js', { dasherizedModuleName: 'my-blueprint' });
      expect(path).to.equal('my-blueprint/controller.js');

      path = Blueprint.prototype.mapFile('__name__/__name__.js', { dasherizedModuleName: 'my-blueprint' });
      expect(path).to.equal('my-blueprint/my-blueprint.js');
    });

    it('accepts locals.fileMap with multiple mappings', function () {
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

  describe('.list', function () {
    beforeEach(function () {
      td.replace(Blueprint, '_existsSync', function (path) {
        return path.indexOf('package.json') === -1;
      });

      td.replace(Blueprint, 'defaultLookupPaths');
      td.when(Blueprint.defaultLookupPaths()).thenReturn([]);

      td.replace(Blueprint, 'load', function (blueprintPath) {
        return {
          name: path.basename(blueprintPath),
        };
      });
    });

    it('returns a list of blueprints grouped by lookup path', function () {
      td.replace(Blueprint, '_readdirSync', function () {
        return ['test1', 'test2'];
      });

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

    it('overrides a blueprint of the same name from another package', function () {
      td.replace(Blueprint, '_readdirSync', function () {
        return ['test2'];
      });

      let list = Blueprint.list({
        paths: ['test0/blueprints', 'test1/blueprints'],
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

  describe('help', function () {
    let blueprint;

    beforeEach(function () {
      blueprint = new Blueprint('path/to/my-blueprint');
    });

    describe('printBasicHelp', function () {
      beforeEach(function () {
        td.replace(blueprint, '_printCommand', td.function());
        td.replace(blueprint, 'printDetailedHelp', td.function());
        td.when(blueprint.printDetailedHelp(), { ignoreExtraArgs: true }).thenReturn('help in detail');
      });

      it('handles overridden', function () {
        Object.assign(blueprint, {
          overridden: true,
        });

        let output = blueprint.printBasicHelp();

        let testString = processHelpString(
          '\
      \u001b[90m(overridden) my-blueprint\u001b[39m'
        );

        expect(output).to.equal(testString);

        td.verify(blueprint._printCommand(), { times: 0 });
      });

      it('calls printCommand', function () {
        td.when(blueprint._printCommand(), { ignoreExtraArgs: true }).thenReturn(' command printed');

        let output = blueprint.printBasicHelp();

        let testString = processHelpString(
          '\
      my-blueprint command printed'
        );

        expect(output).to.equal(testString);
      });

      it('prints detailed help if verbose', function () {
        td.when(blueprint._printCommand(), { ignoreExtraArgs: true }).thenReturn(' command printed');

        let availableOptions = [];
        Object.assign(blueprint, {
          availableOptions,
        });

        let output = blueprint.printBasicHelp(true);

        let testString = processHelpString(`\
      my-blueprint command printed${EOL}\
help in detail`);

        expect(output).to.equal(testString);
      });
    });

    describe('printDetailedHelp', function () {
      it('did not find the file', function () {
        td.replace(Blueprint, '_existsSync', function () {
          return false;
        });

        td.replace(MarkdownColor.prototype, 'renderFile');

        let help = blueprint.printDetailedHelp();
        expect(help).to.equal('');

        td.verify(MarkdownColor.prototype.renderFile(), { ignoreExtraArgs: true, times: 0 });
      });

      it('found the file', function () {
        td.replace(Blueprint, '_existsSync', function () {
          return true;
        });

        td.replace(MarkdownColor.prototype, 'renderFile', function () {
          expect(arguments[1].indent).to.equal('        ');
          return 'test-file';
        });

        let help = blueprint.printDetailedHelp();

        expect(help).to.equal('test-file');
      });
    });

    describe('getJson', function () {
      beforeEach(function () {
        blueprint._printableProperties = ['test1', 'availableOptions'];
      });

      it('iterates options', function () {
        let availableOptions = [
          {
            type: 'my-string-type',
            showAnything: true,
          },
          {
            type: function myFunctionType() {},
          },
        ];

        Object.assign(blueprint, {
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

      it('does not print detailed if not verbose', function () {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        blueprint.getJson();

        td.verify(blueprint.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
      });

      it('is calling printDetailedHelp with availableOptions', function () {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        let availableOptions = [];
        Object.assign(blueprint, {
          availableOptions,
        });

        blueprint.getJson(true);

        td.verify(blueprint.printDetailedHelp(availableOptions));
      });

      it("if printDetailedHelp returns falsy, don't attach property detailedHelp", function () {
        td.replace(blueprint, 'printDetailedHelp', td.function());

        let json = blueprint.getJson(true);

        td.verify(blueprint.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
        expect(json).to.not.have.property('detailedHelp');
      });

      it('sets detailedHelp properly', function () {
        td.replace(blueprint, 'printDetailedHelp', td.function());
        td.when(blueprint.printDetailedHelp(), { ignoreExtraArgs: true }).thenReturn('some details');

        let json = blueprint.getJson(true);

        expect(json.detailedHelp).to.equal('some details');
      });
    });
  });
});
