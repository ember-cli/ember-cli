/* global escape */

'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var proxyquire = require('proxyquire');

var MockUI = require('console-ui/mock');

var mergeTreesStub;
var mergeTrees = proxyquire('../../../lib/broccoli/merge-trees', {
  'broccoli-merge-trees': function() {
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
    var actual = mergeTrees(['foo']);

    expect(actual).to.equal('foo');
  });

  it('returns a constant "empty tree" when passed an empty array', function() {
    var expected = {};

    mergeTrees._overrideEmptyTree(expected);

    var first = mergeTrees([]);
    var second = mergeTrees([]);

    expect(first).to.equal(expected);
    expect(second).to.equal(expected);
  });

  it('passes all inputTrees through when non-empty', function() {
    var expected = ['foo', 'bar'];
    var actual;

    mergeTreesStub = function(inputTrees) {
      actual = inputTrees;
      return {};
    };

    mergeTrees(['foo', null, undefined, 'bar']);
    expect(actual).to.deep.equal(expected);
  });

  it('filters out empty trees from inputs', function() {
    var expected = ['bar', 'baz'];
    var actual;

    mergeTrees._overrideEmptyTree('foo');

    mergeTreesStub = function(inputTrees) {
      actual = inputTrees;
      return {};
    };

    mergeTrees(['foo', 'bar', 'baz']);
    expect(actual).to.deep.equal(expected);
  });

  it('removes duplicate trees with the last duplicate being the remainder', function() {
    var treeA = {};
    var treeB = {};
    var expected = [treeB, treeA];
    var actual;

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
