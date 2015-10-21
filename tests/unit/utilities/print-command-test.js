/*jshint multistr: true */

'use strict';

var printCommand      = require('../../../lib/utilities/print-command');
var processHelpString = require('../../helpers/process-help-string');
var expect            = require('chai').expect;
var EOL               = require('os').EOL;

describe('printCommand', function() {
  it('handles all possible options', function() {
    var availableOptions = [
      {
        name: 'test-option',
        values: ['x', 'y'],
        default: 'my-def-val',
        required: true,
        aliases: ['a', { b: 'c', unused: '' }],
        description: 'option desc'
      },
      {
        name: 'test-type',
        type: Boolean,
        aliases: ['a']
      },
      {
        name: 'test-type-array',
        type: ['a-type', Number]
      }
    ];

    var obj = {
      description: 'a paragraph',
      availableOptions: availableOptions,
      anonymousOptions: ['anon-test', '<anon-test>'],
      aliases: ['ab', 'cd', '', null, undefined]
    };

    var output = printCommand.call(obj, '  ', true);

    var testString = processHelpString('\
 \u001b[33m<anon-test> <anon-test>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
    \u001b[90ma paragraph\u001b[39m' + EOL + '\
    \u001b[90maliases: ab, cd\u001b[39m' + EOL + '\
    \u001b[36m--test-option\u001b[39m\u001b[36m=x|y\u001b[39m \u001b[36m(Required)\u001b[39m \u001b[36m(Default: my-def-val)\u001b[39m option desc' + EOL + '\
      \u001b[90maliases: -a <value>, -b (--test-option=c)\u001b[39m' + EOL + '\
    \u001b[36m--test-type\u001b[39m \u001b[36m(Boolean)\u001b[39m' + EOL + '\
      \u001b[90maliases: -a\u001b[39m' + EOL + '\
    \u001b[36m--test-type-array\u001b[39m \u001b[36m(a-type, Number)\u001b[39m');

    expect(output).to.equal(testString);
  });

  it('can have no margin or no options', function() {
    var output = printCommand.call({
      availableOptions: [],
      anonymousOptions: []
    });

    var testString = processHelpString('');

    expect(output).to.equal(testString);
  });

  it('can have an uncolored description', function() {
    var output = printCommand.call({
      description: 'a paragraph',
      availableOptions: [],
      anonymousOptions: []
    });

    var testString = processHelpString(EOL + '\
  a paragraph');

    expect(output).to.equal(testString);
  });

  it('does not print with empty aliases', function() {
    var output = printCommand.call({
      availableOptions: [],
      anonymousOptions: [],
      aliases: []
    });

    var testString = processHelpString('');

    expect(output).to.equal(testString);
  });
});
