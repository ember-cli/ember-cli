## ember-cli
[![Build Status][travis-badge]][travis-badge-url]
[![Dependency Status][david-badge]][david-badge-url]
[![devDependency Status](https://david-dm.org/ember-cli/ember-cli/dev-status.svg)](https://david-dm.org/ember-cli/ember-cli#info=devDependencies)
[![Build status][appveyor-badge]][appveyor-badge-url]
[![Code Climate](https://codeclimate.com/github/ember-cli/ember-cli/badges/gpa.svg)](https://codeclimate.com/github/ember-cli/ember-cli)
[![Test Coverage](https://codeclimate.com/github/ember-cli/ember-cli/badges/coverage.svg)](https://codeclimate.com/github/ember-cli/ember-cli)
[![Inline docs](http://inch-ci.org/github/ember-cli/ember-cli.svg?branch=master)](http://inch-ci.org/github/ember-cli/ember-cli)
[![npm](https://img.shields.io/npm/v/ember-cli.svg)][npm-badge-url]

The Ember.js command line utility.

Supports node 0.12.x and npm 2.7.x and 3.x.

## Community
* irc: #ember-cli on freenode
* issues: [ember-cli/issues](https://github.com/ember-cli/ember-cli/issues)
* website: [ember-cli.com](http://ember-cli.com)

[![ScreenShot](http://static.iamstef.net/ember-conf-2014-video.jpg)](https://www.youtube.com/watch?v=4D8z3972h64)


## Project Elements
Additional components of this project that are used at runtime in your application:
* [ember-resolver](https://github.com/ember-cli/ember-resolver)
* [loader](https://github.com/ember-cli/loader.js)
* [ember-cli-shims](https://github.com/ember-cli/ember-cli-shims)
* [ember-load-initializers](https://github.com/ember-cli/ember-load-initializers)

## Development Hints
### Working with master

``` sh
git clone https://github.com/ember-cli/ember-cli.git
cd ember-cli
npm link
```

`npm link` is very similar to `npm install -g` except that instead of downloading the package from the repo the just cloned `ember-cli/` folder becomes the global package. Any changes to the files in the `ember-cli/` folder will immediately affect the global ember-cli package.

Now you can use `ember-cli` via the command line:

``` sh
ember new foo
cd foo
npm link ember-cli
ember server
```

`npm link ember-cli` is needed because by default the globally installed `ember-cli` just loads the local `ember-cli` from the project. `npm link ember-cli` symlinks the global `ember-cli` package to the local `ember-cli` package. Now the `ember-cli` you cloned before is in three places: The folder you cloned it into, npm's folder where it stores global packages and the `ember-cli` project you just created.

If you upgrade an app running against Ember CLI master you will need to re-link to your checkout of Ember CLI by running `npm link ember-cli` in your project again.

Please read the official [npm-link documentation](https://www.npmjs.org/doc/cli/npm-link.html) and the [npm-link cheatsheet](http://browsenpm.org/help#linkinganynpmpackagelocally) for more information.

### Working with the tests

Use `npm test` to run the tests (Runs only fast tests).

For a full test run which includes some very slow acceptance tests,
please run: `npm run test-all`. Please note, this is what travis
runs.

To exclude a test or test suite append a `.skip` to `it()` or `describe()` respectively (e.g. `it.skip(...)`). To focus on a certain test or test suite append `.only`.

The default test suite includes JSHint and JSCS.

Please read the official [mocha documentation](http://mochajs.org/) for more information.

### Running specific tests

```sh
node tests/runner.js path/to/test/file path/to/other/test/file
```

Example

```sh
node tests/runner.js tests/acceptance/addon-smoke-test-slow.js
```

### Running JSHint and JSCS only

```sh
npm run lint
```

### Reusing test related npm + bower installs

To prevent test trolling, the test caches for npm and bower are removed for each run.
When trying to rapidly debug an issue disabling this can result in much faster test runs.

For now, the easiest way to disable them is to comment out the following lines https://github.com/ember-cli/ember-cli/blob/664f7998142e8deb9806ca54472f44e8cec9dbcf/tests/runner.js#L13-L14


## Problems

When running ember cli it could happen that a lack of file watches can occur. You will get an error message like:

```sh
Serving on http://localhost:4200
watch ENOSPC
Error: watch ENOSPC
    at errnoException (fs.js:1019:11)
    at FSWatcher.start (fs.js:1051:11)
  ...
```

This problem will be corrected in future releases. The following line is a workaround to get the server up and running until this problem is fixed. See [Issue 1054](https://github.com/ember-cli/ember-cli/issues/1054).

```sh
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

For Arch Linux or Manjaro Linux, in order for the parameters to be loaded at boot, the kernel sysctl parameters have to be saved in a drop-in directory instead of `sysctl.conf`.

```sh
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.d/99-sysctl.conf && sudo sysctl --system
```

## Why is CI broken?

If all pull requests are breaking on the same issue, we likely have a dependency that updated and broke our CI. [This app](http://package-hint-historic-resolver.herokuapp.com/?repoUrl=https%3A%2F%2Fgithub.com%2Fember-cli%2Fember-cli) can tell you which packages updated.

## Inline Documentation

Use `npm run docs` to build HTML and JSON documentation with YUIDoc and place it in `docs/build/`. Please help by improving this documentation.

## Contribution

[See `CONTRIBUTING.md`](https://github.com/ember-cli/ember-cli/blob/master/CONTRIBUTING.md)

## Upgrading

* [Change history of new Ember-CLI apps](https://github.com/kellyselden/ember-cli-output)
* [Change history of new Ember-CLI addons](https://github.com/kellyselden/ember-addon-output)

## Programmatic Access

You can programmatically access the CLI from your node application.
* Create a new node app `npm init`
* Install the cli `npm install ember-cli -save`
* Create index.js
* Use the cli
```
var cli = require("ember-cli/lib/cli");
cli({
    inputStream: process.stdin,
    outputStream: process.stdout,
    cliArgs: ['help']
}).then(function(exitCode) {

});
```
* Run your app with `node .` and it should execute the `ember help` command

## License

ember-cli is [MIT Licensed](https://github.com/ember-cli/ember-cli/blob/master/LICENSE.md).


[travis-badge]: https://travis-ci.org/ember-cli/ember-cli.svg?branch=master
[travis-badge-url]: https://travis-ci.org/ember-cli/ember-cli
[david-badge]: https://david-dm.org/ember-cli/ember-cli.svg
[david-badge-url]: https://david-dm.org/ember-cli/ember-cli
[appveyor-badge]: https://ci.appveyor.com/api/projects/status/7owf61lo8uujbjok/branch/master?svg=true
[appveyor-badge-url]: https://ci.appveyor.com/project/embercli/ember-cli/branch/master
[npm-badge-url]: https://www.npmjs.com/package/ember-cli
