# Build Pipeline Debugging

**Note**: This is _only_ for debugging purposes and should not be relied upon.

To gain more visibility into what broccoli trees Ember CLI operates on, you can run the following command:

```sh
BROCCOLI_DEBUG="bundler:*" ember build
```

Fish equivalent is:

```sh
env BROCCOLI_DEBUG="bundler:*" ember build
```

For a brand new ember application (`ember new your-app-name`), `DEBUG/` folder is going to be created with the following contents:

```sh
DEBUG/
└── bundler:application-and-dependencies
    ├── addon-tree-output
    ├── tree-shake-test
    └── vendor
```

`addon-tree-output` is the folder that contains all trees from Ember CLI add-ons;
`your-app-name` is an application tree and `vendor` contains imported external assets.

Ember CLI uses [`broccoli-debug`](https://github.com/broccolijs/broccoli-debug/) to generate debug output mentioned above.

More tips can be found in our [PERF_GUIDE](./perf-guide.md)
under [DEBUG logging section](./perf-guide.md#debug-logging).
