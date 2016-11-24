var _template = require('lodash.template');

module.exports = function processTemplate(content, context) {
  var options = {
    evaluate:    /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape:      /<%-([\s\S]+?)%>/g
  };
  return _template(content, options)(context);
}
