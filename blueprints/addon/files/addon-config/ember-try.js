'use strict';

const getChannelURL = require('ember-source-channel-url');

const scenarios = [
  {
    name: 'ember-lts-3.12',
    npm: {
      devDependencies: {
        'ember-source': '~3.12.0'
      }
    }
  },
  {
    name: 'ember-lts-3.16',
    npm: {
      devDependencies: {
        'ember-source': '~3.16.0'
      }
    }
  },
  {
    name: 'ember-release',
    npm: {
      devDependencies: {
        'ember-source': await getChannelURL('release')
      }
    }
  },
  {
    name: 'ember-beta',
    npm: {
      devDependencies: {
        'ember-source': await getChannelURL('beta')
      }
    }
  },
  {
    name: 'ember-canary',
    npm: {
      devDependencies: {
        'ember-source': await getChannelURL('canary')
      }
    }
  },
  {
    name: 'ember-default-with-jquery',
    env: {
      EMBER_OPTIONAL_FEATURES: JSON.stringify({
        'jquery-integration': true
      })
    },
    npm: {
      devDependencies: {
        '@ember/jquery': '^0.5.1'
      }
    }
  },
  {
    name: 'ember-classic',
    env: {
      EMBER_OPTIONAL_FEATURES: JSON.stringify({
        'application-template-wrapper': true,
        'default-async-observers': false,
        'template-only-glimmer-components': false
      })
    },
    npm: {
      ember: {
        edition: 'classic'
      }
    }
  }
];

// The default `.travis.yml` runs this scenario via `<% if (yarn) { %>yarn<% } else { %>npm<% } %> test`,
// not via `ember try`, so we don't need it include it in CI. Other than that, we will include it
// so that running `ember try:each` manually will run it along with all the other scenarios, and
// ember try:one can still pick up this config.
if (!process.env.CI) {
  scenarios.push({
    name: 'ember-default',
    npm: {
      devDependencies: {}
    }
  })
};

module.exports = async function() {
  return {
    <% if (yarn) { %>useYarn: true,
    <% } %>scenarios: scenarios
  };
};
