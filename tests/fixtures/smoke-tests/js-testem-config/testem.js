'use strict';

console.log('***CUSTOM_TESTEM_JS**');

const { isCI } = require('ci-info');

module.exports = {
  "framework": "qunit",
  "test_page": "tests/index.html?hidepassed",
  "disable_watching": true,
  "launch_in_ci": [
    "Chrome"
  ],
  "launch_in_dev": [
    "Chrome"
  ],
  "browser_args": {
    "Chrome": [
      // --no-sandbox is needed when running Chrome inside a container
      isCI ? '--no-sandbox' : null,

      "--disable-gpu",
      "--headless",
      "--remote-debugging-port=0",
      "--window-size=1440,900"
    ].filter(Boolean),
  }
};
