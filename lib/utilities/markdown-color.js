'use strict';

var fs                = require('fs');
var marked            = require('marked');
var chalk             = require('chalk');
var TerminalRenderer  = require('marked-terminal');
var SilentError       = require('../errors/silent');
var merge             = require('lodash-node/modern/objects/merge');
var isArray           = require('lodash-node/modern/objects/isArray');

var tokens = {
  // colors
  red: {
    token: '^r^',
    pattern: /(?:\^r\^)(.*?)(?:\^r\^)/g,
    render: renderStylesFactory('red')
  },
  green: {
    token: '^g^',
    pattern: /(?:\^g\^)(.*?)(?:\^g\^)/g,
    render: renderStylesFactory('green')
  },
  blue: {
    token: '^b^',
    pattern: /(?:\^b\^)(.*?)(?:\^b\^)/g,
    render: renderStylesFactory('blue')
  },
  cyan: {
    token: '^c^',
    pattern:/(?:\^c\^)(.*?)(?:\^c\^)/g,
    render: renderStylesFactory('cyan')
  },
  magenta: {
    token: '^m^',
    pattern: /(?:\^m\^)(.*?)(?:\^m\^)/g,
    render: renderStylesFactory('magenta')
  },
  yellow: {
    token: '^y^',
    pattern: /(?:\^y\^)(.*?)(?:\^y\^)/g,
    render: renderStylesFactory('yellow')
  },
  black: {
    token: '^k^',
    pattern: /(?:\^k\^)(.*?)(?:\^k\^)/g,
    render: renderStylesFactory('black')
  },
  grey: {
    token: '^gr^',
    pattern: /(?:\^gr\^)(.*?)(?:\^gr\^)/g,
    render: renderStylesFactory('grey')
  },

  // ember-cli styles
  option: {
    token: '--option',
    pattern: /((--\w*\b)|(<options>))/g,
    render: renderStylesFactory('cyan')
  },
  default: {
    token: '(Default: default)',
    pattern: /(\(Default:\s.*\))/g,
    render: renderStylesFactory('cyan')
  },
  required: {
    token: '(Required)',
    pattern: /(\(Required\))/g,
    render: renderStylesFactory('cyan')
  },
  args:{
    token: '<args>',
    pattern: /(<.*>)/g,
    render: renderStylesFactory('yellow')
  }
};


module.exports = MarkdownColor;

/*

*/
function MarkdownColor(options) {
  var optionTokens = options && options.tokens || {};
  this.options = options || {};
  this.marked = marked;
  this.tokens = merge(tokens, optionTokens);

  var defaultOptions = {
    renderer: new TerminalRenderer(),
  };

  var markedOptions = merge(defaultOptions, this.options);
  this.marked.setOptions(markedOptions);
  return this;
}

MarkdownColor.prototype.renderFile = function (filePath) {
  var file;
  if (fs.existsSync(filePath)) {
    file = fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new SilentError('The file \'' + filePath + '\' doesn\'t exist.' +
      ' Please check your filePath');
  }

  return this.render(file);
};

MarkdownColor.prototype.render = function (string) {
  var input = this.marked(string);
  var styles = Object.keys(tokens);
  styles.map(function(style) {
    input = input.replace(tokens[style].pattern, tokens[style].render);
  });
  input = input.replace(/\~\^(.*)\~\^/g, escapeToken);
  return input;
};

/*

*/
function renderStylesFactory(styleNames){
  var styles;
  if (isArray(styleNames)) {
    styles = styleNames.map(getChalkStyle);
  } else {
    styles = [getChalkStyle(styleNames)];
  }
  return function(match, pattern) {
    return styles.reverse().reduce(function (previous, current) {
      return chalk[current](previous);
    }, pattern);
  };
}

function getChalkStyle(style) {
  if (Object.keys(chalk.styles).indexOf(style) > -1) {
    return style;
  } else {
    throw new SilentError('The style \'' + style + '\' is not supported by chalk.');
  }
}

function escapeToken(match, pattern){
  var output = pattern.replace(/\~/g,'');
  return '^' + output + '^';
}
/*
Formatting colors for ember-cli help

white: ember serve
yellow: <arg-option, >
cyan: --port, --important-option
cyan: (Default: something), (Default: 4200)
white: Description 1, Description 2
cyan: (Required)
*/

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
