'use strict';
const stew = require('broccoli-stew');

module.exports = function shimAmd(tree, nameMapping) {
  return stew.map(tree, (content, relativePath) => {
    let name = nameMapping[relativePath];
    let sections = [
      '(function(define){\n',
      content,
      '\n})((function(){ function newDefine(){ var args = Array.prototype.slice.call(arguments);',
    ];
    if (name) {
      sections.push(' args.unshift("');
      sections.push(name);
      sections.push('");');
    }
    sections.push(' return define.apply(null, args); }; newDefine.amd = true; return newDefine; })());');
    return sections.join('');
  });
};
