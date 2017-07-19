'use strict';

const path = require('path');
const expect = require('chai').expect;
const Assembler = require('../../../lib/assembler');
const MockProject = require('../../helpers/mock-project');

describe('Unit: Assembler', function() {
  describe('constructor', function() {
    it('sets properties', function() {
      const project = new MockProject();
      project.root = path.join(process.cwd(), 'tests/fixtures/assembler/config-tree');

      let assembler = new Assembler({
        name: 'better-errors',
        env: 'development',
        tests: true,
        project,
        registry: {},
        tests: [],
      });

      expect(assembler.name).to.equal('better-errors');
      expect(assembler.env).to.equal('development');
      expect(assembler.tests).to.equal(true);
      expect(assembler.project).to.deep.equal(project);
      expect(assembler.trees).to.be.defined;
      expect(assembler.registry).to.be.defined;
    });
  });

  describe('cache', function() {
    const project = new MockProject();
    project.root = path.join(process.cwd(), 'tests/fixtures/assembler/config-tree');

    let assembler = new Assembler({
      name: 'better-errors',
      env: 'development',
      tests: true,
      project,
    });

    it('configuration tree is cached upon calling `getConfigTree`', function() {
      expect(assembler._cachedConfigTree).to.be.null;

      assembler.getConfigTree();

      expect(assembler._cachedConfigTree).to.be.defined;
    });

    it('templates tree is cached upon calling `getAppTemplatesTree`', function() {
      expect(assembler._cachedTemplatesTree).to.be.null;

      assembler.getAppTemplatesTree();

      expect(assembler._cachedTemplatesTree).to.be.defined;
    });
  });
});
