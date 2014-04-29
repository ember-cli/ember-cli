---
layout: post
title: "Changelog"
permalink: changelog
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-01-changelog.md"
---

### 0.0.25

* [BUGFIX] The blueprinted application's `package.json` forces an older version of `ember-cli`. Fixed in [#518](https://github.com/stefanpenner/ember-cli/pull/518).

### 0.0.24

* Changes to `index.html`: Script tags were moved into body, `ENV` and the app are now defined in the same script tag.
* patch to quickfix some broccoli + Windows IO issues. We expect a proper solution soon, but this will hold us over (#493)[https://github.com/stefanpenner/ember-cli/pull/493]
* Add a custom watcher to make broccoli more usable on windows by catching file errors ([493](https://github.com/stefanpenner/ember-cli/pull/493)).
* Add `ember test` with Testem integration ([388](https://github.com/stefanpenner/ember-cli/pull/388)).
* some improvements to bower dependency management, unfortunately until bower.json stabilizes broccoli-bower stability is at the whim of bower component authors.
* introduce maintainable + upgradable ember app specific brocfile filter
  ([396](https://github.com/stefanpenner/ember-cli/pull/396))
* ember cli now attempts to use the project-local ember-cli if
  available, this should help with people who have multiple versions of
  the cli installed. ([5a3c9a](https://github.com/stefanpenner/ember-cli/commit/5a3c9a97e407c128939feb5bd8cd98db2a8e3181))
* Complete restructuring of how ember-cli works internally
* `ember help` now offers nicely colored output
* Extracts initializers autoloading into bower package ([#337](https://github.com/stefanpenner/ember-cli/pull/337))
  * locks it to version `0.0.1`
* Introduces broccoli-bower ([#333](https://github.com/stefanpenner/ember-cli/pull/333))
  * locks it to version `0.2.0`
* Fix issue where app.js files are appended to tests.js ([#347](https://github.com/stefanpenner/ember-cli/pull/347))
* upgrade broccoli to `0.9.0` [v0.9.0 brocfile changes](https://gist.github.com/joliss/15630762fa0f43976418)
* Use configuration from `config/environments.js` to pass options to `Ember.Application.create`. ([#370](https://github.com/stefanpenner/ember-cli/pull/370))
* Adds per command help output ([#376](https://github.com/stefanpenner/ember-cli/pull/376))
* Ensures that the broccoli trees are cleaned up properly. ([#444](https://github.com/stefanpenner/ember-cli/pull/444))
* Integrate leek package for ember-cli usage analytics reporting. ([#448](https://github.com/stefanpenner/ember-cli/pull/448))
* Generate current live build to `tmp/output/` when running `ember server`. This is very useful for
  debugging the current Broccoli tree without manually running `ember build`. ([#457](https://github.com/stefanpenner/ember-cli/pull/457))
* Added `ember test --server` to run the `testem` command line server. `ember test --server` will automatically re-run your tests after a rebuild. [#474](https://github.com/stefanpenner/ember-cli/pull/474)
* Add JSHinting for `app/` and `test/` trees when building in development. This generates console logs as well as QUnit tests (so that `ember test` shows failures). [#482](https://github.com/stefanpenner/ember-cli/pull/482)
* Use the name specified in `package.json` while doing `ember init`. This allows you to use a different application name than your folder name. [#491](https://github.com/stefanpenner/ember-cli/pull/491)
* Allow disabling live reload via `ember server --live-reload=false`. [#510](https://github.com/stefanpenner/ember-cli/pull/510)


### 0.0.23

* Adds ES6 import validation ([#209](https://github.com/stefanpenner/ember-cli/pull/209))
* CSS broccoli fixes ([#325](https://github.com/stefanpenner/ember-cli/pull/325))
* Speed up boot ([#273](https://github.com/stefanpenner/ember-cli/pull/273))

### 0.0.22

* Makes sure that user cannot create an application named `test`([#256](https://github.com/stefanpenner/ember-cli/pull/256))
* Adds broccoli-merge-trees dependency and updates Brocfile to use it
* Locks blueprint to particular version of ember-cli, broccoli & friends:
  * ember-cli 0.0.21
  * broccoli (v0.7.2)
  * broccoli-es6-concatenator (v0.1.4)
  * broccoli-static-compiler (v0.1.4)
  * broccoli-replace version (v0.1.5)

### 0.0.21

* Use `loader.js` from `bower` ([0c1e8d28](https://github.com/stefanpenner/ember-cli/commit/0c1e8d28ca4bf6d24dc28af1fa4736690394eb5a))
* Drops implementation files ([54df0288](https://github.com/twokul/ember-cli/commit/54df0288cd456aec782f0cbda269c603fe7be005))
* Drop boilerplate tests ([c6f7475e](https://github.com/twokul/ember-cli/commit/c6f7475e0c8b3013b4af8ea5139aa25818aedeaf))
* Use named-amd version of `ic-ajax` ([#225](https://github.com/stefanpenner/ember-cli/pull/225))
* Separate `tests` and `app` code. Tests are now within 'assets/tests.js' ([#220](https://github.com/stefanpenner/ember-cli/pull/220)).
* Implement `--proxy-port` and `--proxy-host` parameters to `ember server` command ([#40](https://github.com/stefanpenner/ember-cli/issues/40))
* Add support for `.ember-cli` file to provide default flags to commands ([7b90bd9](https://github.com/stefanpenner/ember-cli/commit/dfac84ffd27acedfd18189a0e4b0b5d3fb13bd7b))
* Ember initializers are required automatically ([#242](https://github.com/stefanpenner/ember-cli/pull/242))
* Supports alternate preprocessors (eg. broccoli-sass vs. broccoli-ruby-sass) ([59ddbd](https://github.com/stefanpenner/ember-cli/commit/59ddbdf4ce14e8f514d124e158cfdc9708026623))
* Also exposes `registerPlugin` method on preprocessor module that allows anyone to register additional plugins ([59ddbd](https://github.com/stefanpenner/ember-cli/commit/59ddbdf4ce14e8f514d124e158cfdc9708026623))

### 0.0.20

* Run tests through /tests.
* Integrate ember-qunit.
* Makes sure `livereload` reports error from `watcher` ([a1d447fe](https://github.com/stefanpenner/ember-cli/commit/a1d447fe654271f6cf4ea1e6b092a17bc6beed3a))
* Support multiple CSS Preprocessors ([LESS](http://lesscss.org/), [Sass](http://sass-lang.com/) and [Stylus](http://learnboost.github.io/stylus/))
* upgrade broccoli to `0.5.0`.
