#!/usr/bin/env bash

set -e

eval "$(ssh-agent -s)"

openssl aes-256-cbc -K $encrypted_c177ff031535_key -iv $encrypted_c177ff031535_iv -in .travis/deploy_key.pem.enc -out .travis/deploy_key.pem -d
chmod 600 .travis/deploy_key.pem
ssh-add .travis/deploy_key.pem

rm -rf docs/build
npm run docs
cd docs/build

git init
git config user.name "Travis"
git config user.email "noreply@travis-ci.org"
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet git@github.com:ember-cli/api.git master:gh-pages > /dev/null 2>&1
