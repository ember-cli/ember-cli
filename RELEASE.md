# Release Process

> [!WARNING]
> This release process is currently changing and is making its way from the `master` branch to `beta` and `release` as part of the normal release train. Be careful following this document over the next 12 weeks.
> As of time of writing release-plan is only being used for the master branch and the instructions below are for illustrative purposes only

`ember-cli` follows the same channel based release process that Ember does:

* `release` - This branch represents the `latest` dist-tag on NPM
* `beta` - This branch represents the `beta` dist-tag on NPM
* `master` - The branch represents the `alpha` dist-tag on NPM

Most changes should be made as a PR that targets the `master` branch and make their way through `beta` and `release` over the course of 12 weeks as part of the Ember release train. Generally speaking we do not backport functional changes to `beta` or `release` but we can if needs be.

This release process is managed by [release-plan](https://github.com/embroider-build/release-plan) which means that all changes should be made as a pull request to make sure it is captured in the changelog.

## Release process overview

During the release week each of the versions are effectively "promoted" i.e. the current `beta` version is released as `latest`, the current `alpha` version is released as `beta` and a **new** `alpha` version is created. This requires PRs to each of the active branches to update ember-source (and potentially ember-data) versions. Each of those PRs that update dependencies should be marked as `enhancement` if we are releasing a minor version.

The release process during release week should look like this:

- Do an intial stable release from the `release` branch
- Merge `release` into `beta`
- Do a `beta` release
- Merge `beta` into `master`
- Do an `alpha` release



### Initial Stable Release from the `release` branch

- fetch latest from origin `git fetch`
- create a new branch to do the release e.g. `git checkout -B release-6-4 origin/release`
- Update blueprint dependencies to latest

```
node ./dev/update-blueprint-dependencies.js --ember-source=latest --ember-data=latest
```

- push and open a PR targeting `release`
- mark this PR as an `enhancement` if it is a minor release
- check that everything is ok
- merge branch
- check that the Prepare Release PR has been correctly opened by `release-plan`
- Merge it when you are ready to release

### Beta release from the `beta` branch

- fetch latest from origin `git fetch`
- create a new branch to merge `release` into `beta` e.g. `git checkout -B merge-release origin/beta`
- merge release into this new branch e.g. `git merge origin/release --no-ff`
- Update blueprint dependencies to beta

```
node ./dev/update-blueprint-dependencies.js --ember-source=beta --ember-data=beta
```

- push and open a PR targeting `beta`
- mark this PR as an `enchancement` if the next beta is a minor release
- check that everything is ok
- merge branch
- check that the Prepare Release PR has been correctly opened by `release-plan`
  - note: the release-plan config will automatically make this version a pre-release
- Merge it when you are ready to release


### Alpha release from the `master` branch

- fetch latest from origin `git fetch`
- create a new branch to merge `beta` into `master` e.g. `git checkout -B merge-beta origin/master`
- merge release into this new branch e.g. `git merge origin/beta --no-ff`
- Update blueprint dependencies to alpha

```
node ./dev/update-blueprint-dependencies.js --ember-source=alpha --ember-data=canary
```

- push and open a PR targeting `master`
- mark this PR as an `enchancement` if the next alpha is a minor release
- check that everything is ok
- merge branch
- check that the Prepare Release PR has been correctly opened by `release-plan`
  - note: the release-plan config will automatically make this version a pre-release
- Merge it when you are ready to release


## Changelog updates

`release-plan` is designed to automatically generate a Changelog that includes the titles of every PR that was merged since the last release. As we would like to make use of this auto-generated Changelog we need to make sure that PRs are named correctly and the Changelog included in the "Prepare Release" PRs are what we were expecting.

If you want to change the content of the Changelog then you should update the PR titles you want to update and re-run the `Prepare Release` CI job for that branch

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
