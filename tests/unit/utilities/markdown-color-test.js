'use strict';

var MarkdownColor = require('../../../lib/utilities/markdown-color');
var expect        = require('chai').expect;
var path          = require('path');

describe('MarkdownColor', function() {
  var mc;

  beforeEach(function() {
    mc = new MarkdownColor();
  });

  it('parses default markdown', function() {

  });

  it('parses color tokens', function() {
    expect(mc.render('^r^red^r^')).to.equal('\u001b[0m\u001b[31mred\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^g^green^g^')).to.equal('\u001b[0m\u001b[32mgreen\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^b^blue^b^')).to.equal('\u001b[0m\u001b[34mblue\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^c^cyan^c^')).to.equal('\u001b[0m\u001b[36mcyan\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^m^magenta^m^')).to.equal('\u001b[0m\u001b[35mmagenta\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^y^yellow^y^')).to.equal('\u001b[0m\u001b[33myellow\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^k^black^k^')).to.equal('\u001b[0m\u001b[30mblack\u001b[39m\u001b[0m\n\n');
    expect(mc.render('^gr^grey^gr^')).to.equal('\u001b[0m\u001b[90mgrey\u001b[39m\u001b[0m\n\n');

    expect(mc.render('^br^bgRed^br^')).to.equal('\u001b[0m\u001b[41mbgRed\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^bg^bgGreen^bg^')).to.equal('\u001b[0m\u001b[42mbgGreen\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^bb^bgBlue^bb^')).to.equal('\u001b[0m\u001b[44mbgBlue\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^bc^bgCyan^bc^')).to.equal('\u001b[0m\u001b[46mbgCyan\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^bm^bgMagenta^bm^')).to.equal('\u001b[0m\u001b[45mbgMagenta\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^by^bgYellow^by^')).to.equal('\u001b[0m\u001b[43mbgYellow\u001b[49m\u001b[0m\n\n');
    expect(mc.render('^bk^bgBlack^bk^')).to.equal('\u001b[0m\u001b[40mbgBlack\u001b[49m\u001b[0m\n\n');
  });

  it('parses custom tokens', function() {
    expect(mc.render('--option')).to.equal('\u001b[0m\u001b[36m--option\u001b[39m\u001b[0m\n\n');
    expect(mc.render('(Default: value)')).to.equal('\u001b[0m\u001b[36m(Default: value)\u001b[39m\u001b[0m\n\n');
    expect(mc.render('(Required)')).to.equal('\u001b[0m\u001b[36m(Required)\u001b[39m\u001b[0m\n\n');
    expect(mc.render('<args>')).to.equal('\u001b[90m\u001b[33m<args>\u001b[39m\u001b[39m');
  });

  it('accepts tokens on instantiation', function() {
    var mctemp = new MarkdownColor({
      tokens: {
        foo: {
          token: '^foo^',
          pattern: /(?:\^foo\^)(.*?)(?:\^foo\^)/g,
          render: MarkdownColor.prototype.renderStylesFactory(['blue','bgWhite'])
        }
      }
    });
    expect(mctemp.render('^foo^foo^foo^')).to.equal('\u001b[0m\u001b[34m\u001b[47mfoo\u001b[49m\u001b[39m\u001b[0m\n\n');
  });

  it('parses markdown files', function() {
    console.log('\u001b[0m  \u001b[36mtacos are \u001b[33mdelicious\u001b[36m \u001b[34mand I\u001b[39m enjoy eating them \u001b[39m\u001b[0m\n\n');
    expect(mc.renderFile(path.join(__dirname,'../../../tests/fixtures/markdown/foo.md'))).to
      .equal('\u001b[0m  \u001b[36mtacos are \u001b[33mdelicious\u001b[36m \u001b[34mand I\u001b[39m enjoy eating them \u001b[39m\u001b[0m\n\n');
  });

  it('allows tokens inside other token bounds', function() {
    expect(mc.render('^c^tacos are ^y^delicious^y^ and I enjoy eating them ^c^')).to.equal('\u001b[0m\u001b[36mtacos are \u001b[33mdelicious\u001b[36m and I enjoy eating them \u001b[39m\u001b[0m\n\n');
  });
});
/* Chalk supported styles -
styles:
   { reset: { open: '\u001b[0m', close: '\u001b[0m', closeRe: /[0m/g },
     bold: { open: '\u001b[1m', close: '\u001b[22m', closeRe: /[22m/g },
     dim: { open: '\u001b[2m', close: '\u001b[22m', closeRe: /[22m/g },
     italic: { open: '\u001b[3m', close: '\u001b[23m', closeRe: /[23m/g },
     underline: { open: '\u001b[4m', close: '\u001b[24m', closeRe: /[24m/g },
     inverse: { open: '\u001b[7m', close: '\u001b[27m', closeRe: /[27m/g },
     hidden: { open: '\u001b[8m', close: '\u001b[28m', closeRe: /[28m/g },
     strikethrough: { open: '\u001b[9m', close: '\u001b[29m', closeRe: /[29m/g },
     black: { open: '\u001b[30m', close: '\u001b[39m', closeRe: /[39m/g },
     red: { open: '\u001b[31m', close: '\u001b[39m', closeRe: /[39m/g },
     green: { open: '\u001b[32m', close: '\u001b[39m', closeRe: /[39m/g },
     yellow: { open: '\u001b[33m', close: '\u001b[39m', closeRe: /[39m/g },
     blue: { open: '\u001b[34m', close: '\u001b[39m', closeRe: /[39m/g },
     magenta: { open: '\u001b[35m', close: '\u001b[39m', closeRe: /[39m/g },
     cyan: { open: '\u001b[36m', close: '\u001b[39m', closeRe: /[39m/g },
     white: { open: '\u001b[37m', close: '\u001b[39m', closeRe: /[39m/g },
     gray: { open: '\u001b[90m', close: '\u001b[39m', closeRe: /[39m/g },
     bgBlack: { open: '\u001b[40m', close: '\u001b[49m', closeRe: /[49m/g },
     bgRed: { open: '\u001b[41m', close: '\u001b[49m', closeRe: /[49m/g },
     bgGreen: { open: '\u001b[42m', close: '\u001b[49m', closeRe: /[49m/g },
     bgYellow: { open: '\u001b[43m', close: '\u001b[49m', closeRe: /[49m/g },
     bgBlue: { open: '\u001b[44m', close: '\u001b[49m', closeRe: /[49m/g },
     bgMagenta: { open: '\u001b[45m', close: '\u001b[49m', closeRe: /[49m/g },
     bgCyan: { open: '\u001b[46m', close: '\u001b[49m', closeRe: /[49m/g },
     bgWhite: { open: '\u001b[47m', close: '\u001b[49m', closeRe: /[49m/g },
     grey: { open: '\u001b[90m', close: '\u001b[39m', closeRe: /[39m/g } },
*/
