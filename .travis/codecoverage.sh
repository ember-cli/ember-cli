#!/usr/bin/env bash

# fail script immediately on any errors in external commands
set -e

# Use `yarn` to install globals
yarn global add coveralls codeclimate-test-reporter

cat ./coverage/lcov.info | coveralls
codeclimate-test-reporter < ./coverage/lcov.info
