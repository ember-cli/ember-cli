# Error Propagation in Broccoli & Ember CLI

## Quick Summary

This is a short summary of how errors during build time are surfaced to the browser. Let's look at a particular example.

Let's say you have the following template:

```handlebars
<p>Sup you guise<p>
```

There's an unclosd `p` tag. Seems bad.

Here's what is going to happen:

+ `ember-template-compiler` throws an exception
  + `location`
  + `message`
  + `stack`

Error contains information of where in the file error occurred and what kind of error it was.

+ `ember-cli-htmlbars` will catch the error from `ember-template-compiler`.

Because `ember-cli-htmlbars` is based on `broccoli-persistent-filter`, technically `broccoli-persistent-filter`
will catch the exception first. For example, we attach `file` and `treeDir` information to errors [here](https://github.com/stefanpenner/broccoli-persistent-filter/blob/v1.3.1/index.js#L267-L272).

+ `broccoli-builder` catches the error

Ember CLI uses `broccoli-builder` to build its trees so if `broccoli-builder` throws an error,
Ember CLI is aware and can act accordingly.

At this level, we can attach more information to the error, like `broccoli` node/annotation.

+ `broccoli-middleware` catches the error

This is where we return an error page for the browser. Given all the information, we get from `ember-cli-htmlbars`
and `broccoli-builder`, we show an error page.

## Error object

As long as add-ons respect the following error contract, Ember CLI should be able to show useful error messages.
Note, that is just an interface, not an actual class.

```typescript
/**
 * Represents a location of the error.
 * @param {string} line - The line number in the file.
 * @param {string} column - The column number in the file.
 */
interface Position {
  line: number;
  column: number;
}

/**
 * Represents an error that might occur during Ember CLI
 * build process.
 * @param {string} stack - The stack frame of the error.
 * @param {string} message - The error message.
 * @param {string} codeFrame - The nicely formatted code block with line and column number highlighter (babel style).
 * @param {string} type - The class of the error (`Parse Error`, `Compiler Error`, `Syntax Error`).
 * @param {string} location - The position of the error in the file.
 */
interface BuildError {
  stack: string;
  message: string;
  codeFrame: string;
  type: string,
  location: Position;
}
```

On the add-on level, error handling might look something like:

```javascript
'use strict';

const Filter = require('broccoli-persistent-filter');
const stripBom = require('strip-bom');
const nyanCompiler = require('nyan-compiler');

/*
 * Compile semicolons to nyan cats because why not.
 */
class NyanCompiler extends Filter {
  processString(string, relativePath) {
    try {
      return nyanCompiler(stripBom(string), relativePath);
    } catch(e) {
      e.type = 'Nyan Compilation Error';
      // assuming error location is nested
      e.location = e.location.start;

      throw e;
    }
  }
}
```

To give a real world example, let's modify `broccoli-sass-source-map`:

```javascript
function rethrowBuildError(e) {
  if (typeof e === 'string') {
    throw new Error('[string exception] ' + e);
  } else {
    e.type = 'Sass Syntax Error';
    e.message = e.formatted;
    e.location = {
      line: e.line,
      column: e.column
    };

    throw e;
  }
}

SassCompiler.prototype.build = function() {
  // ... code
  return this.renderSass(sassOptions).then(function(result) {
    var files = [
      writeFile(destFile, result.css)
    ];

    if (this.sassOptions.sourceMap && !this.sassOptions.sourceMapEmbed) {
      files.push(writeFile(sourceMapFile, result.map));
    }

    return Promise.all(files);
  }.bind(this)).catch(function(e) {
    rethrowBuildError(e);
  });
};
```
