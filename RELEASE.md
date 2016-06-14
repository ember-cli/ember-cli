# Release Process

Although not very tricky, it is quite easy to deploy something that doesn't
quite work as expected. The following steps help you navigate through some of
the release gotchas and will hopefully result in a successful release.

---

## Preparation

### Communication

- Ensure that homu isn't presently processing any PRs.
- Post a note in [#dev-ember-cli](https://embercommunity.slack.com/archives/dev-ember-cli) letting us know you're doing a release.

> I'm starting an Ember CLI release. Please hold off merging PRs, "homu r+"-ing, and pushing new code!

### Environment

Make sure that you're running the most recent stable `node` and bundled `npm`.

```sh
$ node --version
$ npm --version
```


## Branching

This is the example branching/merging for release channels.

```sh
# Get to known good state.
git checkout master
git reset --hard origin/master
git checkout beta
git reset --hard origin/beta
git checkout release
git reset --hard origin/release

# Prep the stable release
git checkout release
git merge beta

# ... do the stable release ...

# Prep the beta release
git checkout beta
git merge master
git merge vX.Y.Z # whatever the latest stable tag is.

# ... do the beta release ...

git checkout master
git merge vX.Y.Z-beta.N

# ... all things back in master ...
```


## Release

### Setup

* generate changelog
  * if on master branch
    * run `./dev/changelog`
  * if this is a hotfix
    * run `./dev/changelog <branch-name>`
* prepend changelog output to `CHANGELOG.md`
* edit changelog output to be as user-friendly as possible (drop [INTERNAL] changes, non-code changes, etc.)
* replace any "ember-cli" user references in the changelog to whomever made the change
* bump `package.json` version
* don't commit these changes until later
* `./dev/prepare-release`
* the `du` command should give you ballbark 344K as of 2.2.0-beta.5

### Test

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

### Update Artifacts

[Update ember-new-output and ember-addon-output.](https://gist.github.com/nathanhammond/e0a55b4d0328b45b8ef5) Make sure to include the tag links in CHANGELOG.md.

### Publish

If everything went well, publish. Please note, we must have an extremely low
tolerance for quirks and failures. We do not want our users to endure any extra
pain.

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


### Test Again

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


## Promote

Announce release!

### Create a new release on GitHub

* [Draft a new release.](https://github.com/ember-cli/ember-cli/releases/new)
  * enter the new version number as the tag prefixed with `v` e.g. (`v0.1.12`)
  * Make sure to include the links for diffs between the versions.
  * for release title choose a great name, no pressure
  * in the description paste the upgrade instructions from the previous release,
    followed by the new CHANGELOG. entry
  * attach the `ember-cli-<version>.tgz` from above
  * Check Pre-release for beta releases.
  * Publish the release.

### Twitter

> Ember CLI vX.Y.Z "Release name goes here." released!
https://github.com/ember-cli/ember-cli/releases/tag/vX.Y.Z
\#emberjs

### Slack

Grab a link to your tweet and post in:
* [#-announcements](https://embercommunity.slack.com/archives/-announcements)
* [#dev-ember-cli](https://embercommunity.slack.com/archives/dev-ember-cli)
* [#-ember-cli](https://embercommunity.slack.com/archives/-ember-cli)


## Troubleshooting

* if a few mins after release you notice an issue, you can unpublish
  * `npm unpublish ember-cli@<version>`
* if it is completely broken, feel free to unpublish a few hours later or the next morning, even if you don't have time to immediately rerelease
