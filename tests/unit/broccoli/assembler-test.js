'use strict';

const co = require('co');
const Assembler = require('../../../lib/broccoli/assembler');
const mergeTrees = require('broccoli-merge-trees');
const broccoliTestHelper = require('broccoli-test-helper');
const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

const expect = require('chai').expect;

describe('broccoli-assembler', function() {
  let input;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();

    input.write({
      'addon-tree-output': {
        'ember-ajax': {
          'request.js': '',
        },
        'ember-cli-app-version': {
          'initializer-factory.js': '',
        },
        'modules': {
          'ember-data': {
            'transform.js': '',
            'store.js': '',
          },
        },
      },
      'the-best-app-ever': {
        'router.js': 'router.js',
        'app.js': 'app.js',
        'components': {
          'x-foo.js': 'x-foo.js',
        },
        'config': {
          'environment.js': 'environment.js',
        },
      },
      'vendor': {
        'loader': {
          'loader.js': '',
        },
        'ember': {
          'jquery': {
            'jquery.js': '',
          },
          'ember.debug.js': '',
        },
        'ember-cli': {
          'app-boot.js': 'app-boot.js',
          'app-config.js': 'app-config.js',
          'app-prefix.js': 'app-prefix.js',
          'app-suffix.js': 'app-suffix.js',
          'test-support-prefix.js': 'test-support-prefix.js',
          'test-support-suffix.js': 'test-support-suffix.js',
          'tests-prefix.js': 'tests-prefix.js',
          'tests-suffix.js': 'tests-suffix.js',
          'vendor-prefix.js': 'vendor-prefix.js',
          'vendor-suffix.js': 'vendor-suffix.js',
        },
        'ember-cli-shims': {
          'app-shims.js': '',
        },
        'ember-resolver': {
          'legacy-shims.js': '',
        },
      },
    });
  }));

  afterEach(function() {
    input.dispose();
  });

  describe('constructor', function() {
    it('throws an exception if input tree is not passed in', function() {
      expect(() => {
        new Assembler();
      }).to.throw(/You have to pass a broccoli tree in./);
    });

    it('sets `strategies` to an empty array if the property is undefined', function() {
      let assembler = new Assembler(input.path());

      expect(assembler.strategies).to.deep.equal([]);
    });

    it('sets `annotation` to an empty string if the property is undefined', function() {
      let assembler = new Assembler(input.path());

      expect(assembler.annotation).to.equal('');
    });
  });

  it('returns a passed in tree if `strategies` are empty', function() {
    let assembler = new Assembler(input.path());

    expect(assembler.toTree()).to.deep.equal(input.path());
  });

  it('throws an exception if passed in strategy does not define `toTree` method', function() {
    let assembler = new Assembler(input.path(), {
      strategies: [{ }],
    });

    expect(() => {
      expect(assembler.toTree()).to.deep.equal(input.path());
    }).to.throw(/Strategy has to define `toTree` method./);
  });

  it('throws an exception if passed in strategy\'s `toTree` method is not a function', function() {
    let assembler = new Assembler(input.path(), {
      strategies: [{
        toTree: {},
      }],
    });

    expect(() => {
      expect(assembler.toTree()).to.deep.equal(input.path());
    }).to.throw(/`toTree` needs to be a function./);
  });

  it('throws an exception if passed in strategy `toTree` method does not return a tree', function() {
    let assembler = new Assembler(input.path(), {
      strategies: [{
        toTree() {
          return {};
        },
      }],
    });

    expect(() => {
      expect(assembler.toTree()).to.deep.equal(input.path());
    }).to.throw(/`toTree` has to return a broccoli tree./);
  });

  it('produces a correct tree given a custom strategy', co.wrap(function *() {
    let strategyTree = yield createTempDir();
    strategyTree.write({
      'baz.js': 'function foobar() {}',
    });
    // this is a simple "merge" strategy
    // it creates a simple test tree and merges it with the input
    // tree and returns the result
    const mergeTreeStrategy = {
      toTree(assembler, inputTree) {
        return mergeTrees([strategyTree.path(), inputTree], {
          annotation: 'bar.js tree merger',
        });
      },
    };

    let assembler = new Assembler(input.path(), {
      strategies: [mergeTreeStrategy],
      annotation: 'fight fire with fire',
    });

    let finalTree = assembler.toTree();
    let finalTreeOutput = yield buildOutput(finalTree);
    let finalTreeOutputInfo = finalTreeOutput.read();

    expect(finalTree._annotation).to.equal('fight fire with fire');
    expect(finalTreeOutputInfo['baz.js']).to.equal('function foobar() {}');
    expect(Object.keys(finalTreeOutputInfo)).to.deep.equal([
      'addon-tree-output',
      'baz.js',
      'the-best-app-ever',
      'vendor',
    ]);

    strategyTree.dispose();
  }));
});
