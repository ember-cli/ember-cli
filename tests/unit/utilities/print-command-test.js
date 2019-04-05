'use strict';

const printCommand = require('../../../lib/utilities/print-command');
const processHelpString = require('../../helpers/process-help-string');
const expect = require('chai').expect;
const EOL = require('os').EOL;

describe('printCommand', function() {
  it('handles all possible options', function() {
    let availableOptions = [
      {
        name: 'test-option',
        values: ['x', 'y'],
        default: 'my-def-val',
        required: true,
        aliases: ['a', 'long-a', { b: 'c', unused: '' }, { 'long-b': 'c' }],
        description: 'option desc',
      },
      {
        name: 'test-type',
        type: Boolean,
        aliases: ['a'],
      },
      {
        name: 'test-type-array',
        type: ['a-type', Number],
      },
    ];

    let obj = {
      description: 'a paragraph',
      availableOptions,
      anonymousOptions: ['anon-test', '<anon-test>'],
      aliases: ['ab', 'cd', '', null, undefined],
    };

    let output = printCommand.call(obj, '  ', true);

    let testString = processHelpString(`\
 \u001b[33m<anon-test> <anon-test>\u001b[39m \u001b[36m<options...>\u001b[39m${EOL}\
    \u001b[90ma paragraph\u001b[39m${EOL}\
    \u001b[90maliases: ab, cd\u001b[39m${EOL}\
    \u001b[36m--test-option\u001b[39m\u001b[36m=x|y\u001b[39m \u001b[36m(Required)\u001b[39m \u001b[36m(Default: my-def-val)\u001b[39m option desc${EOL}\
      \u001b[90maliases: -a <value>, --long-a <value>, -b (--test-option=c), --long-b (--test-option=c)\u001b[39m${EOL}\
    \u001b[36m--test-type\u001b[39m \u001b[36m(Boolean)\u001b[39m${EOL}\
      \u001b[90maliases: -a\u001b[39m${EOL}\
    \u001b[36m--test-type-array\u001b[39m \u001b[36m(a-type, Number)\u001b[39m`);

    expect(output).to.equal(testString);
  });

  it('can have no margin or no options', function() {
    let output = printCommand.call({
      availableOptions: [],
      anonymousOptions: [],
    });

    let testString = processHelpString('');

    expect(output).to.equal(testString);
  });

  it('can have an uncolored description', function() {
    let output = printCommand.call({
      description: 'a paragraph',
      availableOptions: [],
      anonymousOptions: [],
    });

    let testString = processHelpString(`${EOL}\
  a paragraph`);

    expect(output).to.equal(testString);
  });

  it('does not print with empty aliases', function() {
    let output = printCommand.call({
      availableOptions: [],
      anonymousOptions: [],
      aliases: [],
    });

    let testString = processHelpString('');

    expect(output).to.equal(testString);
  });
});
