'use strict';
const progress = require('../../../lib/utilities/heimdall-progress');
const { expect } = require('chai');
const chalk = require('chalk');

describe('heimdall-progress', function() {
  it('supports the root node', function() {
    // fake the heimdall graph (public heimdall API);
    const heimdall = {
      current: {
        id: {
          name: 'heimdall',
        },
      },
    };

    expect(progress(heimdall)).to.eql('');
  });

  it('complex example', function() {
    // fake the heimdall graph (public heimdall API);
    const heimdall = {
      current: {
        id: {
          name: 'applyPatches',
        },

        parent: {
          id: {
            name: 'babel',
          },
          parent: {
            id: {
              name: 'broccoli',
            },

            parent: {
              id: {
                name: 'heimdall',
              },
            },
          },
        },
      },
    };

    expect(progress(heimdall)).to.eql('broccoli > babel > applyPatches');
  });

  describe('.format', function() {
    it('works', function() {
      expect(progress.format('test content')).to.eql(`${chalk.green('building... ')}[test content]`);
    });
  });
});
