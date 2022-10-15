# Online Editor output:

repo: https://github.com/ember-cli/editor-output

For each supported online editor, there should be a folder
with the online-editor-specific files for that online editor.

For example:
```
stackblitz/
  .stackblitzrc
other-editor/
  .other-editor.js
```

This would result in the following branches on the
editor-output repo:
 - stackblitz-app-output
 - stackblitz-addon-output
 - other-editor-app-output
 - other-editor-addon-output

If an editor requires modifiers specific to them that aren't present in the blueprints, you may defined transforms for those blueprints:

```
{editor-name}/
  __transforms__/
    {blueprint-name}.js
```

example:
```
codesandbox/
  __transforms__/
    app.js
```

These transforms files must have a default export, which will be invoked by the update-output-repos.js script and be passed the directory that the blueprint has been generated in.
