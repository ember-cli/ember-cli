
## ember-cli [![Build Status](https://travis-ci.org/stefanpenner/ember-cli.png?branch=master)](https://travis-ci.org/stefanpenner/ember-cli) [![Dependency Status](https://david-dm.org/stefanpenner/ember-cli.svg)](https://david-dm.org/stefanpenner/ember-cli)

An ember command line utility.

Supports node 0.10.5 and npm 1.4.6.

## Community
* irc: #ember-cli on freenode
* issues: [ember-cli/issues](https://github.com/stefanpenner/ember-cli/issues)
* website: [iamstef.net/ember-cli](http://iamstef.net/ember-cli)


[![ScreenShot](http://static.iamstef.net/ember-conf-2014-video.jpg)](https://www.youtube.com/watch?v=4D8z3972h64)


## Warning

Although potentially exciting, this is still really a WIP, use at your own risk.

## Project Elements
Additional components of this project which are used runtime in your application:
* [ember-jj-abrams-resolver](https://github.com/stefanpenner/ember-jj-abrams-resolver)
* [loader](https://github.com/stefanpenner/loader.js)
* [ember-cli-shims](https://github.com/stefanpenner/ember-cli-shims)
* [ember-load-initializers](https://github.com/stefanpenner/ember-load-initializers)

## Development Hints
### Working with master

``` sh
git clone https://github.com/stefanpenner/ember-cli.git
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

Please read the official [npm-link documentation](https://www.npmjs.org/doc/cli/npm-link.html) and the [npm-link cheatsheet](https://blog.nodejitsu.com/npm-cheatsheet/#Linking_any_npm_package_locally) for more information.

### Working with the tests

Use `npm run-script autotest` to run the tests after every file change (Runs only fast tests). Use `npm test` to run them once.

For a full test run which includes some very slow acceptance tests,
please run: `npm run-script test-all`. Please note, this is what travis
runs.

To exclude a test or test suite append a `.skip` to `it()` or `describe()` respectively (e.g. `it.skip(...)`). To focus on a certain test or test suite append `.only`.

Please read the official [mocha documentation](http://visionmedia.github.io/mocha) for more information.

## Contribution

[See `CONTRIBUTING.md`](https://github.com/stefanpenner/ember-cli/blob/master/CONTRIBUTING.md)


## Donating

All donations will support this project and treats for contributors.

[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/stefanpenner/)

## License

ember-cli is [MIT Licensed](https://github.com/stefanpenner/ember-cli/blob/master/LICENSE.md).
