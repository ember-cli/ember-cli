# Release Process

`ember-cli` follows the same channel based release process that Ember does:

* `release` - This branch represents the `latest` dist-tag on NPM
* `beta` - This branch represents the `beta` dist-tag on NPM
* `master` - The branch represents the `alpha` dist-tag on NPM

Most changes should be made as a PR that targets the `master` branch and then makes their way through `beta` and `release` over the course of 12 weeks as part of the Ember release train. Generally speaking we do not backport functional changes to `beta` or `release` but we can if needs be.

This release process is managed by [release-plan](https://github.com/embroider-build/release-plan) which means that all changes should be made as a pull request to make sure it is captured in the changelog.

## Release process overview

During the release week each of the versions are effectively "promoted" i.e. the current `beta` version is released as `latest`, the current `alpha` version is released as `beta` and a **new** `alpha` version is created. This requires PRs to each of the active branches to update ember-source (and potentially ember-data) versions. Each of those PRs that update dependencies should be marked as `enhancement` if we are releasing a minor version.

The release process during release week should look like this:

- Merge any outstanding `Prepare Alpha Release` branches
- Do an intial stable release from the `release` branch
- Merge `release` into `beta`
- Do a `beta` release
- Merge `beta` into `master`
- Do an `alpha` release

### Merge any outstanding `Prepare Alpha Release` branches

This makes sure that you are starting from a "clean slate" before doing any other releases. This will make each of the following steps easier to follow.

You can use [this saved search](https://github.com/ember-cli/ember-cli/pulls?q=is%3Apr+is%3Aopen+Prepare) to find any outstanding `Prepare Release` branches.


### Initial Stable Release from the `release` branch

- fetch latest from origin `git fetch`
- create a new branch to do the release e.g. `git checkout --no-track -b release-plan-6-4 origin/release`
  - note: branches named like `release-6-4` are used to manage LTS patch releases so we don't want to create a branch with that name at this time
- Merge `origin/beta` into the release branch
  - `git merge origin/beta --no-ff`
  - **make sure to not update the .release-plan file** this should only ever be changed by the release-plan github scripts
  - **make sure to not update the .github/workflows/plan-release.yml file** this should still plan a stable release
  - **make sure to not update the .github/workflows/publish.yml file** this should still publish a stable release
  - **make sure to not update the CHANGELOG.md file** so as not to include the beta or alpha changelogs in the next release
  - make sure to not update the version in the package.json during this step, this will be release-plan's job
  - make sure to not add the `release-plan` config section to the package.json during this step. We are releasing a real release so we don't want to configure release-plan to do a pre-release.
- Update blueprint dependencies to latest

```
node ./dev/update-blueprint-dependencies.js --ember-source=latest --ember-data=latest
```

- commit this update `git commit -am "update blueprint dependencies to latest"`
- push and open a PR targeting `release` with a PR title like `Update all dependencies for 6.4 release`
- mark this PR as an `enhancement` if it is a minor release
- check that everything is ok (i.e. that CI has run correctly and that you have the changes you expect)
- merge branch
- check that the `Prepare Release` PR has been correctly opened by `release-plan`
- Merge the `Prepare Release` branch when you are ready to release
- Check the `Release Stable` GitHub action to make sure the release succeeded

### Beta release from the `beta` branch

- fetch latest from origin `git fetch`
- create a new branch to merge `release` into `beta` e.g. `git checkout --no-track -b merge-release origin/beta`
- merge release into this new branch e.g. `git merge origin/release --no-ff`
  - **make sure to not update the .release-plan file** this should only ever be changed by the release-plan github scripts
- merge master into this new branch too e.g. `git merge origin/master --no-ff`
  - **make sure to not update the .release-plan file** this should only ever be changed by the release-plan github scripts
  - update the alpha version in package.json to be a beta i.e. if the incoming merge is `"version": "6.6.0-alpha.3",` update it to `"version": "6.6.0-beta.0",`
- Update blueprint dependencies to beta

```
node ./dev/update-blueprint-dependencies.js --ember-source=beta --ember-data=beta
```

- commit this update `git commit -am "update blueprint dependencies to beta"`
- push and open a PR targeting `beta`
- mark this PR as an `enchancement` if the next beta is a minor release
- check that everything is ok i.e. CI passes
- merge the `merge-release` branch into `beta` in GitHub
- check that the `Prepare Beta Release` PR has been correctly opened by `release-plan`
  - note: the release-plan config will automatically make this version a pre-release
- Merge the `Prepare Beta Release` when you are ready to release the next beta version
- Check the `Release Beta` GitHub action to make sure the release succeeded


### Alpha release from the `master` branch

- fetch latest from origin `git fetch`
- create a new branch to merge `beta` into `master` e.g. `git checkout --no-track -b merge-beta origin/master`
- merge beta into this new branch e.g. `git merge origin/beta --no-ff`
  - **make sure to not update the .release-plan file** this should only ever be changed by the release-plan github scripts
- manually update the version in pacakge.json to be the next alpha.
  - e.g. if the current alpha is `"version": "6.6.0-alpha.3",` update it to be `"version": "6.7.0-alpha.0",`
- commit this change to the version in package.json: `git commit -am "update to the next alpha version"`
- Update blueprint dependencies to alpha

```
node ./dev/update-blueprint-dependencies.js --ember-source=alpha --ember-data=canary
```

- commit this update `git commit -am "update blueprint dependencies to alpha"`
- push and open a PR targeting `master`
- mark this PR as an `enchancement` if the next alpha is a minor release
- check that everything is ok i.e. CI passes
- merge the `merge-beta` branch into `master` in GitHub
- check that the `Prepare Alpha Release` PR has been correctly opened by `release-plan`
- Merge the `Prepare Alpha Release` when you are ready to release the next alpha version
- Check the `Release Alpha` GitHub action to make sure the release succeeded


## Changelog updates

`release-plan` is designed to automatically generate a Changelog that includes the titles of every PR that was merged since the last release. As we would like to make use of this auto-generated Changelog we need to make sure that PRs are named correctly and the Changelog included in the "Prepare Release" PRs are what we were expecting.

If you want to change the content of the Changelog then you should update the PR titles you want to update and re-run the `Prepare Release` CI job for that branch. If there are PRs that you would prefer to exclude from the changelog (such as the `merge-beta` or `merge-release` PRs) then you can add the `ignore` label to the PR and they will be removed from the changelog.

## Patch Releases

Now that we're using release-plan for all releases, patch releases have become super easy! Every time you merge a PR to any branch that is being released with `release-plan` a new `Prepare Release` PR will be created. When you merge this `Prepare Release` branch it will automatically release the new Patch version.


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
