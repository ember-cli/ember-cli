# Build performance

When we talk about build performance, it is important to understand that there
are several build phases:

+ cold build (booting your app up for the first time)
+ warm build (booting your app up when cache was populated)
+ rebuild (subsequent rebuilds that happen on file change)

*Cold build* is the slowest because the cache is not yet populated and the
application is booting for the first time. Build time varies and depends on
the number of dependencies that application has but ballpark should be around 5
seconds for small to middle size applications and around 15 seconds for large
size applications.

*Warm build* is faster then cold one because the cache was populated already
and it takes less time re-compute dependencies. Build time varies but ballpark
should be around 2 seconds for small to middle size applications and around 10
seconds for large size applications.

*Rebuild* aims to be the fastest because it happens the most often. App/
JavaScript Rebuild time varies but ballpark should be around 200-300ms for
small to middle size applications and up to 1 second for large size
applications (200kloc js + 3000 modules).

  * rebuild of JS in app/ <--- Largely our focus, as this is likely the most common.
  * rebuild of CSS/Sass/Less in app/: largely depends on 3 factors
    * the size of bower_components (we have plans to largely mitigate this one)
    * which preprocessor is being used (libsass vs ruby-sass vs less vs ...)
    * the amount of css
  * rebuild of vendor/, bower_components/ <--- somewhat costly still, due to
    how slow available sourceMap Libraries are. We have WIP with a more v8/JIT
    friendly sourceMap lib, already showing some very nice improvements.

*note* these times are based on a posix box with and SSD, win32 unfortunately
tends to be slower. As we continue to improve performance, both posix and win32
improve, hopefully future work will bring these platforms build times closer
together.

If you see that application timings escape, there might be a problem.

Addons known to cause a slow down (but have not yet been addressed):

* any old non-patch based broccoli plugin
* ember-cli-component-css
* ember-browserify
* ... ?

Make sure to mention which type of the build seems to be the problem so we can
help identify and fix issues faster.

## FAQ/Common Issues & Solutions:

##### Q

My rebuilds are slow. (And I have anti-virus installed)

##### A

Our build-system assumes a relative fast/performant file system (although, we
continue to reduce IO related work). It is quite common for a Anti-virus to
slow down IO.

Common issues:

* anti-virus scanning of <project-root>/tmp/, oftentimes this can be avoided
  altogether.
* anti-virus on-file-access re-scanning files, oftentimes this can be disabled
  for the app directory. or ember can be whitelisted.

##### Q

My rebuilds are slow. (And I am using an encrypted thumb-drive to host my project)

##### A

These sorts of drives are notoriously slow. Although we continue to reduce our
IO overhead, you will be running at a disadvantage. Oftentimes, a much
better alternative is hardware supported full-disk encryption, like on most OSX
corporate laptops (mine included) use. This setup is both reasonably secure,
and has negligible impact on performance.

##### Q

My JavaScript rebuilds are still slow.

##### A

please run

```
npm ls broccoli-funnel broccoli-merge-trees broccoli-filter broccoli-persistent-filter broccoli-concat broccoli-caching-writer
```

and ideally the following should be true (otherwise some upgrades may be required)

* `broccoli-funnel` should be at `^1.0.1`
* `broccoli-merge-trees` should be at `^1.1.0`
* `broccoli-persistent-filter` should be at `^1.1.6`
* `broccoli-filter` often needs to be replaced with
  `broccoli-persistent-filter` (we hope to re-merge the two eventually)
* `broccoli-sourcemap-concat` should be at `^2.0.2` but will soon be replace by
  `broccoli-concat` (we have just re-merged the two)
* `broccoli-caching-writer` should be at `^2.2.1`
* `broccoli-concat` should be at `^2.0.3`
* `broccoli-stew` should be at `^1.2.0`
* likely more...

Up next we should check for old and deprecate plugins

* `npm ls broccoli-static-compiler` this should no longer be used, rather
  `broccoli-funnel` at `v1.0.1` should be used
* ..

##### Q

npm v3 made my build slow

##### A

Well what happened is npm v3 changed the module topology, this coupled with a
misbehaving plugin may result in extra files (maybe all of node_modules) being
pulled into the build. This is going to be slow.., the solution is to find the
offending plugin, and upgrade (or report the issue if it is not yet fixed).

One such plugin is `ember-cli-ic-ajax`, which has been fixed. So please be sure
to upgrade.

Finding such plugins, we can use a series of DEBUG flags, to gain more insight

`DEBUG=broccoli-funnel:Funnel*Addon* ember s` should reveal if extra files are
being pulled into the build

##### Q

My builds are slow, and the above Q/A hasn't helped

##### A

Please be sure to read this full document (including the tips and tricks bellow).
If the issue persists, please report an issue.

Be sure to include:

* `npm version`
* `npm ls` (as a gist)
* ideally a reproduction
  * we are aware some are unable to share apps (even privately), this may prove
    more difficult to debug. Although in some cases, consulting and proper IP
    related paperwork to allow sharing could enable improved debugging


##### Q

My builds are slow for a reason not mentioned here

##### A

We would love a PR improving this guide.

# Various tips and tricks

# How to explore/debug and hopefully address performance issues

### DEBUG logging

We use [heimdalljs-logger](https://github.com/heimdalljs/heimdalljs-logger) for
logging, which supports the same usage as the de facto standard
[debug](https://github.com/visionmedia/debug).  Quite often this can be used to
quickly discover obviously wrong things.

Usage:

* `DEBUG=<pattern> ember s`
* `DEBUG=*  ember s` for all logging (this will be very verbose)
* `DEBUG=ember-cli* ember s` for all ember-cli logging
* `DEBUG=broccoli* ember s` for all broccoli logging
* `DEBUG=broccoli*,ember-cli* ember s` for both broccoli and ember-cli logging

The above patterns will be very verbose.  But to make them even more verbose you
can set the log level via `DEBUG_LEVEL`

* `DEBUG=* DEBUG_LEVEL=debug ember s`

To make them a bit less verbose, a curated set of performance related logging
flags are:

+ `DEBUG=broccoli-caching-writer:* ember s`
+ `DEBUG=broccoli-funnel:* ember s`
+ `DEBUG=broccoli-funnel:Funnel*Addon* ember s`
+ `DEBUG=broccoli-merge-trees ember s`
+ `DEBUG=broccoli-merge-trees:TreeMerger* ember s`
+ `DEBUG=broccoli-merge-trees:Addon* ember s`
+ `DEBUG=broccoli-merge-trees:styles ember s`
+ `DEBUG=broccoli-merge-trees:compileTemplates* ember s`
+ `DEBUG=broccoli-merge-trees:compileTemplates* ember s`

Because many plugins are used repeatedly it may be difficult to see the context
for log entries.  By default, 3 nodes of context are shown.

```
DEBUG_LEVEL=debug DEBUG=broccoli-merge-trees: ember build
broccoli-merge-trees: [TreeMerger (testFiles)#777 -> ConcatWithMaps#782 -> BroccoliMergeTrees#783] deriving patches
```

To show more (or fewer) lines of context, specify the environment variable
`DEBUG_DEPTH`.

```
DEBUG_DEPTH=5 DEBUG_LEVEL=debug DEBUG=broccoli-merge-trees: ember build
# => broccoli-merge-trees: [TreeMerger (allTrees)#1 -> BroccoliMergeTrees#668 -> TreeMerger (testFiles)#777 -> ConcatWithMaps#782 -> BroccoliMergeTrees#783]
```

`[... ConcatWithMaps#782 -> BroccoliMergeTrees#783]` means that the log entry
occurred in broccoli merge-trees node with id 783, whose parent was a concat
with maps node with id 782.  These ids are shown in the visualization graph.
See [Visualization](#visualization) for details.

... more on what to look for ...

### `broccoli-viz`

#### Visualization

To visualize build tree, we use [graphviz](http://www.graphviz.org/). To
install it run `brew install graphviz` or download it directly from
[here](http://www.graphviz.org/Download.php).

You will also need to install
[broccoli-viz](https://github.com/stefanpenner/broccoli-viz) version `4.0.0` or
higher.  `npm install -g broccoli-viz@^4.0.0`.

To generate visualization:

+ `BROCCOLI_VIZ=1 ember build`
+ `broccoli-viz instrumentation.build.0.json > instrumentation.build.0.dot`
+ `dot -Tpng instrumentation.build.0.dot > instrumentation.build.0.png`


Each build will generate an additional graph, `instrumentation.build.<build-number>.json`

#### in-depth look

in-depth tooling, aimed to provide much deeper insight into the given build

+ `dot`: is the input to graphviz, allowing tree visualization
+ `json`: more detailed counts and timings related to the corresponding build

