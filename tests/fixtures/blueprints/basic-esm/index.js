'use strict';

import Blueprint from '@ember-tooling/blueprint-model';

export default class BasicEsm extends Blueprint {
  description = 'A basic blueprint';
  beforeInstall(options, locals) {
    return Promise.resolve().then(function () {
      locals.replacementTest = 'TESTY';
    });
  }
}
