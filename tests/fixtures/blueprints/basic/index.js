'use strict';

const Blueprint = require('../../../../lib/models/blueprint');
const Promise = require('../../../../lib/ext/promise');

module.exports = Blueprint.extend({
  description: 'A basic blueprint',
  beforeInstall: function(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
});
