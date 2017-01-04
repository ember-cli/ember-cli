#!/usr/bin/env bash

# For now we will use `npm` for globals.
# Can switch to `yarn` once we no longer support Node.js 0.12:
# - travis_retry yarn global add coveralls codeclimate-test-reporter
travis_retry npm install -g coveralls codeclimate-test-reporter
cat coverage/lcov.info | codeclimate-test-reporter
cat coverage/lcov.info | coveralls
