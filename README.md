ember-cli [![Build Status](https://travis-ci.org/stefanpenner/ember-cli.png?branch=master)](https://travis-ci.org/stefanpenner/ember-cli)
=========

a ember commandline utility.


Warning
=======

Although potentially exciting, this is still really a WIP, use at your own risk.


Getting Started
===============

```sh
npm install -g ember-cli

mkdir my-cool-app
cd my-cool-app
ember init
ember server
```

Why?
====

The https://github.com/stefanpenner/ember-app-kit project has proved to be quite useful, we have learned lots, and
it allowed us to iterate quickly while building real ambitious applications.

While it's initial incarnation is useful, it has several meta problems:

1. It is not "simple" and appears daunting.
2. Because of inline configuration, the api surface area is massive
3. #2 does not allow users to express the "what" just the "how", this prevents EAK from doing more of the heavy lifting itself.
4. [#2 #3] makes it quite tedious to upgrade

Rationale for #3
===============

If we want to upgrade or swap in a faster build pipeline it would be a major pain currently. But with #3, in theory it should be minimal pain.

Guidelines
==========
  - convention over configuration. (look to rails)
    - we should provide internal configuration/implementation to satisfy the 'what' with the how.
  - simple > easy
  - the current contents of tasks/* should reside in the ember executables library
  - the pipeline-related Broccoli configuration should also reside in the above mentioned library.

Usage
===========

Install from npm
-------------------

```sh
npm install ember-cli -g
```

Current Commands
----------------

```sh
ember build <env-name>
ember server
ember init [app-name] [--dry-run] [--skip-npm-install]
ember new [app-name]
```

Developing
==========

You may want to use `npm link` to make your local source directory a globally installed package.
See [npm-developers](https://www.npmjs.org/doc/misc/npm-developers.html)

Running tests
-------------

Once:
```sh
npm test
```

On every file change:
```sh
npm run-script autotest
```

Ideas
=====
  - excutable  (this project)

  ```sh
  ember
  ember init  <app-name>
  ember build <env-name> [default: development] [optional: target path]
  ember server
    --autotest   [default: false]
    --port       [default: 8000]
    --subscribe  [default:release, optional: (beta|canary)]
                   # on "start" of an app, it will prompt the user if the channel they
                   # subscribe to has an update.
                   # if an update occured. they are asked [yes, no] to try the update (using bower)
                   #   (what about other libs? ember-data or components or..)
    --env        [default: development] # allow previewing the various build envs.
    --app        [default: .]

  ember generate [...]
  ember generate scaffold [...] # for resources

  ember addon # reserved for future use.
  ```
  - folder structure: (very similar to what we currently have)

  ```sh
  app/*            # like EAK today
  tasks/           # custom user tasks
  vendor/          # mostly for bower, some non-bower stuff will reside.
  tests/           # tests test config and test helpers.
  tmp/*            # created on demand, but scratch pad for EAK.
  Brocfile.js      # should contain a mechanism for default ember tasks to be loaded
                   # should be the place for users to define custom broccoli related things.
  package.json
  bower.json
  .gitignore
  .travis
  .jshintrc
  ```

  - configuration
    ```shell
    server.js                    # for adding additional connect middleware (like a proxy to the backend)
    Brocfile                     # default tasks will exist in "ember"
    tasks/                       # custom user tasks
    ```
  - detect .js, .coffee, .styl, .scss, .sass
    and use the appropriate filter, or throw with useful error.
    e.g:
    ```javascript
new Error("tried compiling: `app.coffee` but CoffesScript is Missing, to install please: npm install coffee-script --save-dev")
     ````

  - tasks
    consider extracting them into broccoli-ember
