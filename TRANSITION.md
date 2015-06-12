# Brocfile Transition

Transitioning your Brocfile is fairly straight forward. Simply take the contents of your Brocfile and place it in the body of the function in the new `ember-cli-build.js` file.  Instead of using `module.exports` to return the tree simply have the function return the tree.  Ensure you pass the project to the EmberApp constructor and any options you were passing to `EmberApp` in the Brocfile.

## Before

```
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var app = new EmberApp();
module.exports = app.toTree();
```

## After
```
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(project) {
    var app = new EmberApp({
        project: project
    });

    return app.toTree();
};
```