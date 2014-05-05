
## ember-cli [![Build Status](https://travis-ci.org/stefanpenner/ember-cli.png?branch=master)](https://travis-ci.org/stefanpenner/ember-cli) [![Stories in Ready](https://badge.waffle.io/stefanpenner/ember-cli.png?label=ready&title=Ready)](https://waffle.io/stefanpenner/ember-cli)

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

`npm link` is very similar to `npm install -g` except that instead of downloading the package from the repo the just cloned `ember-cli/` folder becomes the global package. Any changes to the files in the `ember-cli/` folder will immediatly affect the global ember-cli package.

Now you can use `ember-cli` via the command line:

``` sh
ember new foo
cd foo
npm link ember-cli
ember server
```

`npm link ember-cli` is needed because by default the globally installed `ember-cli` just loads the local `ember-cli` from the project. `npm link ember-cli` symlinks the global `ember-cli` package to the local `ember-cli` package. Now the `ember-cli` you cloned before is in three places: The folder you cloned it into, npm's folder where it stores global packages and the `ember-cli` project you just created.

Please read the official [npm-link documentation](https://www.npmjs.org/doc/cli/npm-link.html) and the [npm-link cheatsheet](https://blog.nodejitsu.com/npm-cheatsheet/#Linking_any_npm_package_locally) for more information.

#### Testing with master

The master build of ember-cli will run your project tests using [PhantomJS][] by default.  Make sure you have this installed:

```console
brew install phantomjs
```

### Working with the tests

Use `npm run-script autotest` to run the tests after every file change (Runs only fast tests). Use `npm test` to run them once.

To exclude a test or test suite append a `.skip` to `it()` or `describe()` respectively (e.g. `it.skip(...)`). To focus on a certain test or test suite append `.only`.

Please read the official [mocha documentation](http://visionmedia.github.io/mocha) for more information.

## License

ember-cli is [MIT Licensed](https://github.com/stefanpenner/ember-cli/blob/master/LICENSE.md).


[PhantomJS]: http://phantomjs.org/
