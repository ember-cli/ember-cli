'use strict';
const stew = require('broccoli-stew');

module.exports = function shimAmd(tree, nameMapping) {
  return stew.map(tree, (content, relativePath) => {
    let name = nameMapping[relativePath];
    if (name) {
      return `
(function(define, module){

${content}

  if (define.defined === false && module.exports) { 
    define([], function () { 
      return module.exports; 
    });
  }
})((function(){ 
  function newDefine(){ 
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === "string") { args.shift(); }
    args.unshift("${name}");
    define.defined = true; 
    return define.apply(null, args);
  }; 

  newDefine.amd = true; 
  newDefine.defined = false; 

  return newDefine;
})(), {});
`;
    } else {
      return content;
    }
  });
};
