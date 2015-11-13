# Build performance

When we talk about build performance, it is important to understand that there
are several build types:

+ cold build (booting your app up for the first time)
+ warm build (booting your app up when cache was populated)
+ rebuild (subsequent rebuilds that happen on file change)

Cold build is the slowest because the cache is not yet populated and the application is booting for the first time.
Build time varies and depends on the number of dependencies that application has but ballpark should be around 5 seconds
for small to middle size applications and around 15 seconds for large size applications.

Warm build is faster then cold one because the cache was populated already and it takes less time re-compute dependecies.
Build time varies but ballpark should be around 2 seconds for small to middle size applications and around 10 seconds for
large size applications.

Rebuild is the fastest operantion because the cache is in prime. Build time varies but ballpark should be around 200-300ms
for small to middle size applications and up to 1 second for large size applications.

If you see that application timings crawl out of boundaries, there might be a problem.

Make sure to mention which type of the build seems to be the problem so we can
help identify and fix issues faster.

## FAQ/Common Issues & Solutions:

##### Q

My rebuilds are slow.

##### A

Make sure that `broccoli-funnel` and `broccoli-merge-trees` are version `1.0.0` and higher. That might mean that you are
going to have to upgrade application's dependencies. By running `npm ls <package-name>` under the root of your project, you
can quickly see installed versions of the package.

##### Q

npm v3 made my build slow (changed the module topo, accidentaly increasing the number of input files to the vendor tree)

##### A

`DEBUG=broccoli-funnel:Funnel*Addon* ember s` to find it. Solution in many cases, is to look at offending plugins that accidentally include too much.
One such plugin is `ember-cli-ic-ajax`, which has been fixed. So please be sure to upgrade.

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
+ `dot -Tpng grap.<version>.dot > out.png` (each build, will generate an additional graph.<build-number>.dot  graph.<build-number>.json)

#### in-depth look

in-depth tooling, aimed to provide much deeper insight into the given build

+ `dot`: is the input to graphviz, allowing tree visualization
+ `json`: more detailed counts and timings related to the corresponding build
