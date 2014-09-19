Release
=======

Although not very tricky, it is quite easy to deploy something that
doesn't quite work as expected. The following steps navigate a through
some of the release gotchas and will hopefully result in a successful
release.

STEPS:
------

1. ensure you using the latest node `v0.10.x` (but not v0.11.x for now,
   as it has a broken zlib which causes it to publish corrupted modules)
* bump `gh-pages/_config.yml` version
* bump package.json version
* `rm -rf node_modules`
* `npm cache clear`
* `npm install`
* `npm pack`
* remove current installed version: `npm uninstall -g ember-cli`
* install the new package (for testing) `npm install -g ./ember-cli-<version>.tgz`
* `cd to/someplace/to/test/`
* ensure `ember version` is the newly packaged version
* ensure new project generation works  `ember new my-cool-test-project`
  this will fail with: `version not found: ember-cli@version`
* fixup deps: `cd my-cool-test-project`
* link your local ember-cli  `npm link ember-cli`
* install other deps: `npm install`
* install bower deps: `bower install`
* test the server: `ember s`
* test other things like generators
* test upgrades of other apps.

If everything went well, release:

Please note, we have must have an extremely low tollerance for quirks
and failures we do not want our users to endure any extra pain

1. go back to ember-cli directory
* ~npm publish ./ember-cli-<version>.tgz`

Test published version

1 `npm uninstall -g ember-cli`
* `npm cache clear`
* `npm install -g ember-cli`
* ensure version is as expected `ember version`
* ensure new project generates
* ensure old project upgrades nicely
