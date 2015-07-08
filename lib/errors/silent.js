'use strict';

var silentError = require('silent-error');
var deprecate   = require('../utilities/deprecate');

module.exports = function(){
  deprecate('`ember-cli/lib/errors/silent.js` is deprecated,'+
    ' use `silent-error` instead.', true);
    
  return silentError;
};