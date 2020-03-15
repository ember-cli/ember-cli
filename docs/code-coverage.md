# Ember CLI Code Coverage & Analysis

We are using [Coveralls](https://coveralls.io/) to track our code coverage
and [Code Climate](https://codeclimate.com/) to analyze the complexity our code base.

Code coverage information is generated using [istanbuljs](https://github.com/istanbuljs/nyc)
and then later uploaded to both
[Coveralls](https://coveralls.io/github/ember-cli/ember-cli) and
[Code Climate](https://codeclimate.com/github/ember-cli/ember-cli) via
[`.github/workflows/coverage.yml`](../.github/workflows/coverage.yml) after each Pull Request.

`CC_TEST_REPORTER_ID` is set via [GitHub encrypted
secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)
and not exposed to the public as they are private tokens.
