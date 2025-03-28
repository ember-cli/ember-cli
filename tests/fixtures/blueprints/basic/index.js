'use strict';

const Blueprint = require ('@ember/blueprint-model');

module.exports = Blueprint.extend({
  description: 'A basic blueprint',
  beforeInstall(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
});
