'use strict';

const Blueprint = require('../../../../lib/models/blueprint');
const Promise = require('rsvp').Promise;

module.exports = Blueprint.extend({
  description: 'A basic blueprint',
  beforeInstall(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
});
