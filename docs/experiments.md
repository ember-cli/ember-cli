# Experiments

"Experiments" are what Ember CLI calls [Feature Toggle](https://en.wikipedia.org/wiki/Feature_toggle).

An experiment can be summarized into three different states.

## Development
During developement, we enable an experiment and guard the code path. (As well
as tests) By default, all experiments in this stage are enabled.

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
If the experiment is not ready, experiment is deleted from the codebase.

## Supported
Once an experiment has gone through the different stages of beta, and we can
confidently say a specific feature from an experiment will be supported, we
delete the exerpiemnt from the codebase.
