# Ember CLI Code Coverage & Analysis

We are using [Coveralls](https://coveralls.io/) to track our code coverage
and [Code Climate](https://codeclimate.com/) to analyze the complexity our code base.

Code coverage information is generated using [istanbuljs](https://github.com/istanbuljs/nyc)
and then later uploaded to both
[Coveralls](https://coveralls.io/github/ember-cli/ember-cli) and
[Code Climate](https://codeclimate.com/github/ember-cli/ember-cli) via
[`.travis/codecoverage.sh`](../.travis/codecoverage.sh) after each Pull Request.

`CODECLIMATE_REPO_TOKEN`, `COVERALLS_REPO_TOKEN` and `COVERALLS_SERVICE_NAME` are set via Travis CI
Settings and not exposed to the public as they are private tokens.
