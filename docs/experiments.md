# Experiments

"Experiments" are what Ember CLI calls [Feature Toggle](https://en.wikipedia.org/wiki/Feature_toggle).

They are defined in `lib/experiments/index.js`. For example:

```javascript
const availableExperiments = [
  'CONFIG_CACHING',
];
```

When a new feature is added, all supporting code and tests **must** be guarded
to ensure all tests pass when the feature is enabled _or_ disabled:

```javascript
const { isExperimentEnabled } = require('../experiments');

// ...snip...
if (isExperimentEnabled('SOME_EXPERIMENT')) {
  ...
} else {
  ...
}
```

An experiment can be summarized into three different states.

## Development

During active development of a feature, it can be enabled by setting the experiments
related environment variable (`'EMBER_CLI_' + EXPERIMENT_NAME`).

For example, to enable the `CONFIG_CACHING` experiment mentioned in the example
above while running tests you would run the following command:

```
EMBER_CLI_CONFIG_CACHING=true yarn test
```


## Unsupported

The Ember CLI core team will evaluate each experiment before betas get released.
If the experiment is not ready, the entry for the experiment is deleted from
`lib/experiments/index.js` (and therefore disabled).

## Supported

Once an experiment has gone through the different stages of beta, and we can
confidently say a specific feature from an experiment will be supported, we
delete the entry in `lib/experiments/index.js` and remove the experiment guards
(e.g. if (experiments.FOO_BAR) {) from the codebase.
