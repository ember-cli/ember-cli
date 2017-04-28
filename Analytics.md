# Analytics:

Ember-cli tracks (only) the following data points:

* ember-cli version
* build/rebuild/live-reload times
* how many errors occurred

** note: no personally identifying information is tracked, if something is
being leaked please [disclose responsibly](https://emberjs.com/security) **

This information is used to:

* See if there are upgrade blockers (users stuck on old version)
* Have a broad idea for build performance (to make sure we don't regress, and how to prioritize)
* See which high-level features are used (serve/test/build/generate etc.)
* See an increase/decrease in error rates

## Still Not comfortable?

We understand! To permanently disable any analytics gathering you can update your project's `.ember-cli` file (or `$HOME/.ember-cli` for user-wide):

```json
{
  "disableAnalytics": true
}
```

## Who has access

The ember and ember-cli core teams.

## Links to each code-point where ember-cli emits tracking information

* command name (ember server, ember exam, etc.): to understand what high-level features are used
  * https://github.com/ember-cli/ember-cli/blob/2da9de596370c0e78ea0c0c3ffcd6a551d2863a9/lib/models/command.js#L277
* build error: the name of the error
  * https://github.com/ember-cli/ember-cli/blob/6ec50a1fd21d961f0b0e2ca4daf66a8e7dea6417/lib/models/watcher.js#L32-L34
* build/rebuild time
  * https://github.com/ember-cli/ember-cli/blob/503ede1fcb5224d54dc36f82af84550a91d90f26/lib/tasks/build.js#L33
  * https://github.com/ember-cli/ember-cli/blob/503ede1fcb5224d54dc36f82af84550a91d90f26/lib/tasks/build.js#L44
* live reload
  * https://github.com/ember-cli/ember-cli/blob/503ede1fcb5224d54dc36f82af84550a91d90f26/lib/tasks/server/livereload-server.js#L167
  * https://github.com/ember-cli/ember-cli/blob/503ede1fcb5224d54dc36f82af84550a91d90f26/lib/tasks/server/livereload-server.js#L181
