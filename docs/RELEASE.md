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
node --version
npm --version
```


## Branching

If you're planning to release a stable/bugfix version _and_ a beta, make sure to release the beta _after_ the stable version.

```sh
# Fetch changes from GitHub
git fetch origin
```

Once you're done following these instructions make sure that you push your `master`, `beta`, and `release` branches back to GitHub.


### Promoting beta to stable

Follow these steps if you're releasing a new minor or major version (e.g. from `v2.5.0` to `v2.6.0`):

```sh
# Switch to "release" branch and reset it to "origin/beta"
git checkout -B release --track origin/beta

# Merge any unmerged changes from "origin/release" back in
git merge origin/release

# ... do the stable release ...

# Switch to "beta" branch and reset it to "origin/beta"
git checkout -B beta --track origin/beta

# Merge the new stable release into the "beta" branch
git merge vX.Y.0
```


### Stable bugfix release

Follow these steps if you're releasing a bugfix for a stable version (e.g. from `v2.5.0` to `v2.5.1`)

```sh
# Switch to "release" branch and reset it to "origin/release"
git checkout -B release --track origin/release

# ... do the stable release ...

# Switch to "beta" branch and reset it to "origin/beta"
git checkout -B beta --track origin/beta

# Merge the new stable release into the "beta" branch
git merge vX.Y.Z
```


### Promoting canary to beta

Follow these steps if you're releasing a beta version after a new minor/major release (e.g. `v2.7.0-beta.1`)

```sh
# Switch to "beta" branch and reset it to "origin/master"
git checkout -B beta --track origin/master

# Merge any unmerged changes from "origin/beta" back in
git merge origin/beta

# ... do the beta release ...

# Switch to "master" branch and reset it to "origin/master"
git checkout -B master --track origin/master

# Merge the new beta release into the "master" branch
git merge vX.Y.0-beta.1

# Confirm that experiments are turned on before pushing it back to master.
# Push back upstream.
git push origin
```


### Incremental beta release

Follow these steps if you're releasing a beta version following another beta (e.g. `v2.7.0-beta.N` with `N != 1`)

```sh
# Switch to "beta" branch and reset it to "origin/beta"
git checkout -B beta --track origin/beta

# ... do the beta release ...

# Switch to "master" branch and reset it to "origin/master"
git checkout -B master --track origin/master

# Merge the new beta release into the "master" branch
git merge vX.Y.0-beta.N
```


## Release

### Setup

* Update Ember and Ember Data versions.
  * `blueprints/app/files/package.json`
* generate changelog
  * if on master branch
    * run `./dev/changelog`
  * if this is a beta
    * run `./dev/changelog beta`
  * if this is a release
    * run `./dev/changelog release`
* prepend changelog output to `CHANGELOG.md`
* edit changelog output to be as user-friendly as possible (drop [INTERNAL] changes, non-code changes, etc.)
* replace any "ember-cli" user references in the changelog to whomever made the change
* bump `package.json` version
* don't commit these changes until later
* run `./dev/prepare-release`
* the `du` command should give you ballbark 200K as of `2.13.3`

### Test

* `cd to/someplace/to/test/`
* ensure `ember version` is the newly packaged version

```shell
# ensure new project generation works
ember new --skip-npm my-cool-test-project
cd my-cool-test-project

# link your local ember-cli
npm link ember-cli

# install other deps
npm install

# test the server
ember serve
```

* test other things like generators and live-reload
* generate an http mock `ember g http-mock my-http-mock`
* test upgrades of other apps
* if releasing using Windows, check that it works on a Linux VM
  * we are checking if any Windows line endings snuck in, because they won't work on Unix
* if releasing using Unix, you are set, Windows can read your line endings
* If `release` or `beta` confirm that all experiments are off.

### Update Artifacts

* if normal release
  * run `./dev/add-to-output-repos.sh`
* if incremental beta release
  * run `./dev/add-to-output-repos.sh beta`
* if promoting canary to beta
  * run `./dev/add-to-output-repos.sh beta fork`
* copy the [`ember new` diff] and [`ember addon` diff] lines from the previous
  release changelog and paste into the current, then update the url with the
  newer tags

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
