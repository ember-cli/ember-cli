# Node Support

## Supported Version Matrix

| Node LTS Version | Supported Ember CLI Versions |
|------------------|------------------------------|
| 0.10.x           | 0.0.0 - 2.8.x                |
| 0.12.x           | 0.0.0 - 2.11.x               |
| 4.x              | 1.13.9 - 3.1.x               |
| 5.x              | 1.13.9 - 2.6.3               |
| 6.x              | 2.9.0 - Current              |
| 7.x              | 2.10.0 - 2.16.x              |
| 8.x              | 2.13.3 - Current             |
| 9.x              | 2.16.2 - Current             |
| 10.x             | 3.1.3 - Current              |


## Design

Commits to the `HEAD` of the master branch will provide support for any Active
Node.js LTS and the current stable Node.js version(s).
This will be enforced via CI, preventing us from landing code which won't work
with versions which we support. This means that our schedule for support is
tied to the [LTS release schedule for
Node.js](https://github.com/nodejs/LTS#lts_schedule).

## Current support:

* v6: Released as stable version then converted to LTS. 
  * Supported by ember-cli/ember-cli#master until: 2019-04-30.
* v8: Released as stable version then converted to LTS.
  * Supported by ember-cli/ember-cli#master until: 2019-12-31
* v9: Released as stable (not an LTS)
  * Supported by ember-cli/ember-cli#master until: 2018-07-01.
* v10: Released as stable version then converted to LTS.
  * Supported by ember-cli/ember-cli#master until: 2021-04-30.

## Release Process and Support Policy

Ember and Ember CLI have committed to supporting the [Node.js LTS schedule](https://github.com/nodejs/LTS#lts-schedule)
for the `HEAD` of our `master` branch(es). This means that we will will drop support
per the [Node.js Release Working Group](https://github.com/nodejs/Release)'s schedule without a major version
bump/change of ember-cli itself.
