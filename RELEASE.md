Release
=======

Although not very tricky, it is quite easy to deploy something that
doesn't quite work as expected. The following steps navigate a through
some of the release gotchas and will hopefully result in a successful
release.

STEPS:
------

1. let other contributors know that you are preparing a release and to hold off on merging PRs or pushing new code
* ensure you are using the latest stable node
* generate changelog
  * if on master branch
    * run `./bin/changelog`
  * if this is a hotfix
    * run `./bin/changelog <branch-name>`
* prepend changelog output to `CHANGELOG.md`
* edit changelog output to be as user-friendly as possible (drop [INTERNAL] changes, non-code changes, etc.)
* replace any "ember-cli" user references in the changelog to whomever made the change
* bump `package.json` version
* don't commit these changes until later
* `./bin/prepare-release`
* the `du` command should give you ballbark 344K as of 2.2.0-beta.5
* `cd to/someplace/to/test/`
* ensure `ember version` is the newly packaged version
* ensure new project generation works  `ember new --skip-npm my-cool-test-project`
* fixup deps: `cd my-cool-test-project`
* link your local ember-cli  `npm link ember-cli`
* install other deps: `npm i`
* test the server: `ember s`
* test other things like generators and live-reload
* generate an http mock `ember g http-mock my-http-mock`
* test upgrades of other apps
* if releasing using Windows, check that it works on a Linux VM
  * we are checking if any Windows line endings snuck in, because they won't work on Unix
* if releasing using Unix, you are set, Windows can read your line endings

If everything went well, release:

Please note, we must have an extremely low tolerance for quirks
and failures. We do not want our users to endure any extra pain.

1. go back to ember-cli directory
* `git add` the modified `package.json` and `CHANGELOG.md`
* Commit the changes `git commit -m "Release vx.y.z"` and push `git push`
* `git tag "vx.y.z"`
* `git push origin <vx.y.z>`
* publish to npm
  * if normal release
    * `npm publish ./ember-cli-<version>.tgz`
  * if beta release
    * `npm publish ./ember-cli-<version>.tgz --tag beta`

Test published version

1. `npm uninstall -g ember-cli`
* `npm cache clear`
* install
  * if normal release
    * `npm install -g ember-cli`
  * if beta release
    * `npm install -g ember-cli@beta`
* ensure version is as expected `ember version`
* ensure new project generates
* ensure old project upgrades nicely

Tag the release

1. Under `Releases` on GitHub choose `Draft New Release`
* enter the new version number as the tag prefixed with `v` e.g. (`v0.1.12`)
* for release title choose a great name, no pressure
* in the description paste the upgrade instructions from the previous release, followed by the new CHANGELOG entry
* attach the `ember-cli-<version>.tgz` from above
* click pre-release for beta releases
* publish the release

Update the site

1. check out ember-cli/ember-cli.github.io
* update `_config.yml` version
* update `_posts/2012-01-01-changelog.md`

Announce release!

1. on Twitter
* then crosslink Twitter post on slack #dev-ember-cli and #ember-cli

Problems

* if a few mins after release you notice an issue, you can unpublish
  * `npm unpublish ember-cli@<version>`
* if it is completely broken, feel free to unpublish a few hours later or the next morning, even if you don't have time to immediately rerelease
