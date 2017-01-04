/* global escape */

'use strict';

let fs = require('fs');
let expect = require('chai').expect;
let proxyquire = require('proxyquire');

let MockUI = require('console-ui/mock');

let mergeTreesStub;
let mergeTrees = proxyquire('../../../lib/broccoli/merge-trees', {
  'broccoli-merge-trees'() {
    return mergeTreesStub.apply(this, arguments);
  },
});

describe('broccoli/merge-trees', function() {
  beforeEach(function() {
    mergeTreesStub = function() {
      return {};
    };
  });

  afterEach(function() {
    // reset the shared EMPTY_MERGE_TREE to ensure
    // we end up back in a consistent state
    mergeTrees._overrideEmptyTree(null);
  });

  it('returns the first item when merging single item array', function() {
    let actual = mergeTrees(['foo']);

    expect(actual).to.equal('foo');
  });

  it('returns a constant "empty tree" when passed an empty array', function() {
    let expected = {};

    mergeTrees._overrideEmptyTree(expected);

    let first = mergeTrees([]);
    let second = mergeTrees([]);

    expect(first).to.equal(expected);
    expect(second).to.equal(expected);
  });

  it('passes all inputTrees through when non-empty', function() {
    let expected = ['foo', 'bar'];
    let actual;

    mergeTreesStub = function(inputTrees) {
      actual = inputTrees;
      return {};
    };

    mergeTrees(['foo', null, undefined, 'bar']);
    expect(actual).to.deep.equal(expected);
  });

  it('filters out empty trees from inputs', function() {
    let expected = ['bar', 'baz'];
    let actual;

    mergeTrees._overrideEmptyTree('foo');

    mergeTreesStub = function(inputTrees) {
      actual = inputTrees;
      return {};
    };

    mergeTrees(['foo', 'bar', 'baz']);
    expect(actual).to.deep.equal(expected);
  });

  it('removes duplicate trees with the last duplicate being the remainder', function() {
    let treeA = {};
    let treeB = {};
    let expected = [treeB, treeA];
    let actual;

    mergeTreesStub = function(inputTrees) {
      actual = inputTrees;
      return {};
    };

    mergeTrees([treeB, treeA, treeB, treeA, treeA]);

    expect(actual).to.deep.equal(expected);
    expect(actual[0]).to.equal(treeB);
    expect(actual[1]).to.equal(treeA);
  });
});
