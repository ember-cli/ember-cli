'use strict';

import Blueprint from '../../../../lib/models/blueprint.js';

export default Blueprint.extend({
  description: 'A basic blueprint',
  beforeInstall(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
});
