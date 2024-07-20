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
pnpm install
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
pnpm install
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
pnpm install
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
pnpm install
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

## Post-release Automation

There is a GitHub Actions workflow, https://github.com/ember-cli/ember-cli/actions/workflows/sync-output-repos.yml that pushes various invocations of the blueprint generator to "output repos".
After release, make sure that all the jobs are "green" / succeeded.

<details><summary>What to check afterwards</summary>

- Apps: https://github.com/ember-cli/ember-app-output
- Addons: https://github.com/ember-cli/ember-addon-output

Both of these have a git-tag per release version

### Online Editors

Multiple editors could be supported, but right now, we only "customize" for stackblitz.

https://github.com/ember-cli/editor-output/
- [a branch for each scenario + release version](https://github.com/ember-cli/editor-output/branches/active)
  - `${editorName}-{addon,app}-output{-'typescript'?}{-version}`
  - and the "latest release" (non beta) will not have a version at the end
  - This includes [app, addon] X [javascript, typescript]

#### StackBlitz

To make sure StackBlitz runs in their supported browsers (Chrome and FireFox, as of 2023-08-15)

- App + JS: https://stackblitz.com/github/ember-cli/editor-output/tree/stackblitz-app-output
- App + TS: https://stackblitz.com/github/ember-cli/editor-output/tree/stackblitz-app-output-typescript
- Addon + JS: https://stackblitz.com/github/ember-cli/editor-output/tree/stackblitz-addon-output
- Addon + TS: https://stackblitz.com/github/ember-cli/editor-output/tree/stackblitz-addon-output-typescript

The App + JS, and App + TS are linked from Stackblitz's frontend templates UI: https://stackblitz.com/?starters=frontend

</details>

<details><summary>if problems arise</summary>

Script for updating addon/app repos: https://github.com/ember-cli/ember-cli/blob/master/dev/update-output-repos.js
Script for updating editors: https://github.com/ember-cli/ember-cli/blob/master/dev/update-editor-output-repos.js

Customizations on top of the default blueprint(s) are found here: https://github.com/ember-cli/ember-cli/tree/master/dev/online-editors/stackblitz
The intent for these customizations is to either be very light, or not needed at all.
If an online editor breaks with our default blueprint, then it's most likely that _we_ have a bug (or something _very goofy_).

</details>
