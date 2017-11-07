# Experiments

"Experiments" are what Ember CLI calls [Feature Toggle](https://en.wikipedia.org/wiki/Feature_toggle).

They are defined in `lib/experiments/index.js`. For example:

```javascript
let experiments = {
  CONFIG_CACHING: symbol('config-caching'),
};

```

An experiment can be summarized into three different states.

## Development
During developement, we enable an experiment and guard the code path (as well
as tests). By default, all experiments in this stage are enabled.

During development, we guard the code path like this:

```javascript
if (experiments.MODULE_UNIFICATION) {
  ...
} else {
  ...
}
```

## Unsupported
The Ember CLI core team will evaluate each experiment before betas get released.
If the experiment is not ready, the entry for the experiment is deleted from
lib/experiments/index.js.

## Supported
Once an experiment has gone through the different stages of beta, and we can
confidently say a specific feature from an experiment will be supported, we
delete the entry in lib/experiments/index.js and remove the experiment guards
(e.g. if (experiments.FOO_BAR) {) from the codebase.
