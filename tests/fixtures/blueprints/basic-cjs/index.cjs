'use strict';

const Blueprint = require('../../../../lib/models/blueprint');

module.exports = Blueprint.extend({
  description: 'A basic blueprint',
  beforeInstall(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
});
