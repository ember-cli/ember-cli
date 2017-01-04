'use strict';

/*
  This file is used to allow the test suite to disable various
  experiment flags and confirm behavior works properly.

  Example:

  ```
  var experiments = require('../../experiments');

  describe('some feature', function() {
    afterEach(function() {
      // reset to original value
    });

    if (experiments.SOME_FEATURE) {
      describe('enabled', function() {
        // tests here
      });
    }

    describe('disabled', function() {
      beforeEach(function() {
        process.env.DISABLE_EMBER_CLI_FEATURES = 'SOME_FEATURE';
      });

      // tests here
    });
  });
  ```
 */
var defaultExperiments = require('../lib/experiments');

var experiments = {};

function defineFeature(featureName) {
  Object.defineProperty(experiments, featureName, {
    get: function() {
      var includeFeature = true;

      if (process.env.DISABLE_EMBER_CLI_FEATURES === 'true') {
        includeFeature = false;
      }

      if (process.env.DISABLE_EMBER_CLI_FEATURES && process.env.DISABLE_EMBER_CLI_FEATURES.indexOf(featureName) === -1) {
        includeFeature = false;
      }

      if (includeFeature) {
        return defaultExperiments[featureName];
      }

      return undefined;
    },
  });
}

// used to force `lib/experiments/index.js` to opt-out
// of canary behavior
for (var featureName in defaultExperiments) {
  defineFeature(featureName);
}

Object.freeze(experiments);

module.exports = experiments;
