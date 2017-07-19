'use strict';

const path = require('path');
const expect = require('../../chai').expect;
const broccoli = require('broccoli-builder');
const fixturify = require('fixturify');
const Assembler = require('../../../lib/assembler');
const Fixturify = require('broccoli-fixturify');
const MockProject = require('../../helpers/mock-project');

describe('Acceptance: Assembler', function() {
  describe('application templates tree', function() {
    const project = new MockProject();
    project.root = path.join(process.cwd(), 'tests/fixtures/assembler/app-tree');

    let assembler = new Assembler({
      name: 'better-errors',
      env: 'development',
      tests: true,
      project,
      trees: {
        templates: new Fixturify({
          'application.hbs': '{{outlet}}',
          'index.hbs': '<h1>Index</h1>',
          components: {
            'x-tree.hbs': '<h1>x-tree</h1>',
          },
        }),
      },
      registry: {
        extensionsForType() {
          return ['hbs'];
        },
      },
    });

    let b = new broccoli.Builder(assembler.getAppTemplatesTree());

    it('builds a tree with templates nested under application name\'d folder', function() {
      return b.build().then(options => {
        let configurationTree = fixturify.readSync(options.directory);

        expect(configurationTree).to.deep.equal({
          'better-errors': {
            templates: {
              'application.hbs': '{{outlet}}',
              'index.hbs': '<h1>Index</h1>',
              components: {
                'x-tree.hbs': '<h1>x-tree</h1>',
              },
            },
          },
        });
      });
    });
  });

  describe('configuration tree', function() {
    const project = new MockProject();
    project.root = path.join(process.cwd(), 'tests/fixtures/assembler/config-tree');

    let assembler = new Assembler({
      name: 'better-errors',
      env: 'development',
      tests: true,
      project,
    });
    let b = new broccoli.Builder(assembler.getConfigTree());

    after(function() {
      b.cleanup();
    });

    it('builds a tree with two configurations: development and test', function() {
      return b.build().then(options => {
        let configurationTree = fixturify.readSync(options.directory);

        expect(configurationTree).to.deep.equal({
          'better-errors': {
            config: {
              environments: {
                'development.json': '{"baseURL":"/","locationType":"auto"}',
                'test.json': '{"baseURL":"/","locationType":"auto"}',
              },
            },
          },
        });
      });
    });
  });
});
