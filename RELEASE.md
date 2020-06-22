# Release Process


ember-cli follows the same channel based release process that Ember does:

* `release` - This branch represents the `latest` dist-tag on NPM
* `beta` - This branch represents the `beta` dist-tag on NPM
* `master` - The branch is not released to the NPM registry, but (generally speaking) can be used directly

## General Release Process

* Checkout the branch being released
* Update the CHANGELOG.md
  * Run `node ./dev/changelog`
  * Copy output into `CHANGELOG.md`
  * Edit to make clearer for consumers (remove non-consumer facing entries, etc)
  * Commit
* Release: `npx release-it`
* Update GitHub Release with changelog contents
