# Release Process

ember-cli follows the same channel based release process that Ember does:

* `release` - This branch represents the `latest` dist-tag on NPM
* `beta` - This branch represents the `beta` dist-tag on NPM
* `master` - The branch is not released to the NPM registry, but (generally speaking) can be used directly

## Initial Stable Release

* Update blueprint dependencies to latest

```
node ./dev/update-blueprint-dependencies.js --ember-source=latest --ember-data=latest
```

* Commit
* Send pull request to `beta` branch
* Wait for PR (for updating blueprint dependencies) to be merged

* Checkout the `release` branch

```
git fetch origin
git checkout -B release --track origin/release
```

* Merge `beta` branch into `release`

```
git fetch origin
git merge origin/beta
git push origin release
```

* Ensure you have the correct dependencies

```
git clean -fdx
yarn
```

* Update the CHANGELOG.md
  * Run `node ./dev/changelog`
  * Copy output into `CHANGELOG.md`
  * Edit to make clearer for consumers (remove non-consumer facing entries, etc)
  * Ensure blueprint change diff URLs are correct
  * Merge any prior beta entries together
  * Update changelog header for current release
  * Commit
* Release: `npx release-it`
* Update GitHub Release with changelog contents
* Merge `release` into `beta` branch

```
git checkout -B beta --track origin/beta
git merge origin/release
git push origin beta
```

## Stable Patch Release

* Checkout the `release` branch

```
git fetch origin
git checkout -B release --track origin/release
```

* Ensure you have the correct dependencies

```
git clean -fdx
yarn
```

* Update the CHANGELOG.md
  * Run `node ./dev/changelog`
  * Copy output into `CHANGELOG.md`
  * Edit to make clearer for consumers (remove non-consumer facing entries, etc)
  * Ensure blueprint change diff URLs are correct
  * Update changelog header for current release
  * Commit
* Release: `npx release-it`
* Update GitHub Release with changelog contents
* Merge `release` into `beta` branch

```
git checkout -B beta --track origin/beta
git merge origin/release
git push origin beta
```

## Initial Beta Release

* Update `ember-source` and `ember-data` to latest beta

```
node ./dev/update-blueprint-dependencies.js --ember-source=beta --ember-data=beta
```

* Commit
* Send pull request to `master` branch
* Wait for PR (for updating blueprint dependencies) to be merged
* Checkout the `beta` branch

```
git fetch origin
git checkout -B beta --track origin/beta
```

* Merge `master` branch into `beta`

```
git fetch origin
git merge origin/master
git push origin beta
```

* Ensure you have the correct dependencies

```
git clean -fdx
yarn
```

* Update the CHANGELOG.md
  * Run `node ./dev/changelog`
  * Copy output into `CHANGELOG.md`
  * Edit to make clearer for consumers (remove non-consumer facing entries, etc)
  * Ensure blueprint change diff URLs are correct
  * Update changelog header for current release
  * Commit
* Release: `npx release-it`
* Update GitHub Release with changelog contents
* Merge `beta` into `master` branch

```
git checkout master
git merge origin/beta
git push origin master
```

## Subsequent Beta Release

* Checkout the `beta` branch

```
git fetch origin
git checkout -B beta --track origin/beta
```

* Ensure you have the correct dependencies

```
git clean -fdx
yarn
```

* Update the CHANGELOG.md
  * Run `node ./dev/changelog`
  * Copy output into `CHANGELOG.md`
  * Edit to make clearer for consumers (remove non-consumer facing entries, etc)
  * Ensure blueprint change diff URLs are correct
  * Update changelog header for current release
  * Commit
* Release: `npx release-it`
* Update GitHub Release with changelog contents
* Merge `beta` into `master` branch

```
git checkout master
git merge origin/beta
git push origin master
```
