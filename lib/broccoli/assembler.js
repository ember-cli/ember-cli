'use strict';

const mergeTrees = require('broccoli-merge-trees');
const BroccoliDebug = require('broccoli-debug');

function isBroccoliTree(tree) {
  return typeof tree.rebuild === 'function' || tree._inputNodes !== undefined;
}

/**
 *
 * @class Assembler
 * @constructor
 * @param {BroccoliTree} An input broccoli tree
 * @param {Object} Configuration options for `broccoli-concat`
 */
module.exports = class Assembler {
  constructor(inputTree, _options) {
    this._debugTree = BroccoliDebug.buildDebugCallback('assembler');
    const options = _options || {};

    if (inputTree === undefined) {
      throw new Error('You have to pass a broccoli tree in.');
    }

    this.inputTree = this._debugTree(inputTree, 'js:input');
    this.strategies = options.strategies || [];
    this.annotation = options.annotation || '';
  }

  toTree() {
    const strategies = this.strategies;

    if (strategies === undefined || strategies.length === 0) {
      return this.inputTree;
    }

    const treeList = strategies
      .map(strategy => {
        if (strategy.toTree === undefined) {
          throw new Error('Strategy has to define `toTree` method.');
        }

        if (typeof strategy.toTree !== 'function') {
          throw new Error('`toTree` needs to be a function.');
        }

        const tree = strategy.toTree(this, this.inputTree);

        if (tree === undefined || tree === null || !isBroccoliTree(tree)) {
          throw new Error('`toTree` has to return a broccoli tree.');
        }

        return tree;
      });

    return this._debugTree(mergeTrees(treeList, {
      annotation: this.annotation,
    }), 'js:output');
  }
};
