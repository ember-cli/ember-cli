#!/usr/bin/env bash

# fail script immediately on any errors in external commands
set -e

# Use `yarn` to install globals
yarn global add coveralls codeclimate-test-reporter

./node_modules/.bin/nyc report --reporter text-lcov | coveralls
./node_modules/.bin/nyc report --reporter text-lcov | codeclimate-test-reporter
