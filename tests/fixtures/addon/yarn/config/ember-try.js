module.exports = {
  useYarn: true,
  scenarios: [
    {
      name: 'ember-lts-2.12',
      npm: {
        devDependencies: {
          'ember-source': '~2.12.0'
        }
      }
    },
    {
      name: 'ember-lts-2.16',
      npm: {
        devDependencies: {
          'ember-source': '~2.16.0'
        }
      }
    },
    {
      name: 'ember-release',
      npm: {
        devDependencies: {
          'ember-source': 'github:emberjs/ember.js#release'
        }
      }
    },
    {
      name: 'ember-beta',
      npm: {
        devDependencies: {
          'ember-source': 'github:emberjs/ember.js#beta'
        }
      }
    },
    {
      name: 'ember-canary',
      npm: {
        devDependencies: {
          'ember-source': 'github:emberjs/ember.js#master'
        }
      }
    },
    {
      name: 'ember-default',
      npm: {
        devDependencies: {}
      }
    }
  ]
};
