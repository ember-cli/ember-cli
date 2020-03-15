# Build Concurrency

In order to speed up your project's build time, Ember CLI has added a bit of
concurrency throughout the build system. The exact number of parallel
transpilation jobs that will be used can be customized via the `JOBS` process
environment variable.

The default value for `process.env.JOBS` is (max concurrency) - 1 (via
`require('os').cpus().length - 1`), however there may be times when you need to
customize this value to avoid issues.

The most common case for this is in CI systems like GitHub Actions, TravisCI,
and CircleCI where the total number of CPU's available on the system is very
large (> 32) but the individual CI jobs are limited to only 1.5 or 2 concurrent
processes.
