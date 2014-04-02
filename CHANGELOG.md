# ember-cli Changelog

* Use `loader.js` from `bower` ([0c1e8d28](https://github.com/stefanpenner/ember-cli/commit/0c1e8d28ca4bf6d24dc28af1fa4736690394eb5a))
* Drops implementation files ([54df0288](https://github.com/twokul/ember-cli/commit/54df0288cd456aec782f0cbda269c603fe7be005))
* Drop boilerplate tests ([c6f7475e](https://github.com/twokul/ember-cli/commit/c6f7475e0c8b3013b4af8ea5139aa25818aedeaf))
* Use named-amd version of `ic-ajax` ([#225](https://github.com/stefanpenner/ember-cli/pull/225))
* Separate `tests` and `app` code. Tests are now within 'assets/tests.js' (#220).
* Implement `--proxy-port` and `--proxy-host` parameters to `ember server` command (#40)
* Add support for `.ember-cli` file to provide default flags to commands ([7b90bd9](https://github.com/stefanpenner/ember-cli/commit/dfac84ffd27acedfd18189a0e4b0b5d3fb13bd7b))

### 0.0.20

* Run tests through /tests.
* Integrate ember-qunit.
* Makes sure `livereload` reports error from `watcher` ([a1d447fe](https://github.com/stefanpenner/ember-cli/commit/a1d447fe654271f6cf4ea1e6b092a17bc6beed3a))
* Support multiple CSS Preprocessors ([LESS](http://lesscss.org/), [Sass](http://sass-lang.com/) and [Stylus](http://learnboost.github.io/stylus/))
* upgrade broccoli to 0.5.0. slight Brocfile syntax change:

  ```js
  var foo = makeTree("foo")
  // is now just
  var foo = "foo";
  ```
