# Build performance

When we talk about build performance, it is important to understand that there
are several build phases:

+ cold build (booting your app up for the first time)
+ warm build (booting your app up when cache was populated)
+ rebuild (subsequent rebuilds that happen on file change)

*Cold build* is the slowest because the cache is not yet populated and the
application is booting for the first time.  Build time varies and depends on
the number of dependencies that application has but ballpark should be around 5
seconds for small to middle size applications and around 15 seconds for large
size applications.

*Warm build* is faster then cold one because the cache was populated already
and it takes less time re-compute dependecies.  Build time varies but ballpark
should be around 2 seconds for small to middle size applications and around 10
seconds for large size applications.

*Rebuild* aims to be the fastest because it happens the most often.  Rebuild time
varies but ballpark should be around 200-300ms for small to middle size
applications and up to 1 second for large size applications (200kloc js + 3000
modules).

If you see that application timings escape, there might be a problem.

Make sure to mention which type of the build seems to be the problem so we can
help identify and fix issues faster.

## Tools

### DEBUG

Quick, high-level look. Good for finding low hanging fruit.

+ `DEBUG=broccoli-funnel:* ember s`
+ `DEBUG=broccoli-funnel:Funnel*Addon* ember s`
+ `DEBUG=broccoli-merge-trees:TreeMerger* ember s`
+ `DEBUG=broccoli-merge-trees:Addon* ember s`
+ `DEBUG=broccoli-merge-trees:styles ember s`
+ `DEBUG=broccoli-merge-trees:compileTemplates* ember s`

### `broccoli-viz`

#### Visualization

To visualize build tree, we use [graphviz](http://www.graphviz.org/). To install it run `brew install graphviz` or download it directly from [here](http://www.graphviz.org/Download.php).

To generate visualization:

+ `BROCCOLI_VIZ=true ember build`
+ `dot -Tpng graph.<version>.dot > out.png` (each build, will generate an additional graph.<build-number>.dot  graph.<build-number>.json)

#### in-depth look

in-depth tooling, aimed to provide much deeper insight into the given build

+ `dot`: is the input to graphviz, allowing tree visualization
+ `json`: more detailed counts and timings related to the corresponding build

## FAQ/Common Issues & Solutions:

##### Q

My rebuilds are slow.

##### A

please run

```
npm ls broccoli-funnel broccoli-merge-trees broccoli-filter broccoli-persistent-filter broccoli-concat broccoli-caching-writer
```

and ideally the following should be true (otherwise some upgrades may be required)

* `broccoli-funnel` should be at `^1.0.1`
* `broccoli-merge-trees` should be at `^1.1.0`
* `broccoli-persistent-filter` should be at `^1.1.6`
* `broccoli-filter` often needs to be replaced with `broccoli-persistent-filter` (we hope to re-merge the two eventually)
* `broccoli-sourcemap-concat` should be at `^2.0.2` but will soon be replace by `broccoli-concat` (we have just re-merged the two)
* `broccoli-caching-writer` should be at `^2.2.1`
* `broccoli-concat` should be at `v2.0.3`
* likely more...

Up next we should check for old and deprecate plugins

* `npm ls broccoli-static-compiler` this should no longer be used, rather `broccoli-funnel` at `v1.0.1` should be used
* ..

Up next we should look for not-yet-fixed plugins

* `npm ls ember-component-css` (this plugin needs to be updated to not monkey patch ember-cli, as its monkey patching restores issues)

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

