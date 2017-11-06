# Experiments

"Experiments" are what Ember CLI calls [Feature Toggle](https://en.wikipedia.org/wiki/Feature_toggle).

An experiment can be summarized into three different states.

## Development
During developement, we enable an experiment and guard the code path. (As well
as tests) By default, all experiments in this stage is enabled.

## Unsupported
The Ember CLI core team will evaluate each experiment before betas get released.
If the experiment is not ready, we delete the experiment from the codebase.

During development, we guard the code path like this:

```javascript
if (experiments.MODULE_UNIFICATION) {
  ...
} else {
  ...
}
```

If the experiment is not ready to progress to beta, we remove the experiment and
feature is disabled.

## Supported
Once an experiment has through the different betas, and we can confidently say
this experiment will be supported, we also need to clean up the experiment.

When the next set of beta is determined to be released, Ember CLI team reviews
all the experiments and either let them roll into betas or consider them
unsupported and disable them.
