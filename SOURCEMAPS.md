# Sourcemaps

Today, we expect sourcemaps to work in ember-cli. A default ember-cli
application should have functioning sourcemaps, with the exception of in-module
ES6 -> ES5 mappings.  This is for two reasons:

1. dramatically increases build costs
2. babel (at least at the time) does not correctly mangle names, which results in
   a very poor debugging experience when some of your variables are debuggable
   and others are not.  We hope this is eventually rectified.

ember-cli, via ef4/fast-sourcemap-concat, attempts to detect invalid sourcemaps,
and discards them while still producing a valid, correct but incomplete
sourcemap.  This means inputs with invalid sourcemaps can still be viewed
separately in the chrome debugger (as separate "files"), but will have no
mappings (eg for function names).

If your experience differs from the above, please read the rest of
this document before logging an issue.

## Debugging Sourcemaps

Sourcemaps can be a bit tricky to read. This is due to them being VLQ encoded,
and humans not being very good at decoding VLQ on the fly.

There are broadly two ways a source file will have sourcemaps attached.

1. Via an external map file
2. Inline, in Base64.

External sourcemap files can be read with the [helper tools at
fast-source-map](https://github.com/krisselden/fast-source-map/tree/master/bin).

Inline sourcemaps will look something like

```
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlubmVyL2ZpcnN0LmpzIiwiaW5uZXIvc2Vjb25kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIG1lYW5pbmdPZkxpZmUoKSB7XG4gIHRocm93IG5ldyBFcnJvcig0Mik7XG59XG5cbmZ1bmN0aW9uIGJvb20oKSB7XG4gIHRocm93IG5ldyBFcnJvcignYm9vbScpO1xufVxuIiwiZnVuY3Rpb24gc29tZXRoaW5nRWxzZSgpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwic29tZXRoaWduIGVsc2VcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBOyIsImZpbGUiOiJhbGwtaW5uZXIuanMifQ==
```


The easiest way to read them is to first convert them to an external map file.
To do so:

1. take the part after `base64,` and in node `new Buffer(string,
   'base64').toString();`
2. write this to a file, and one can now use the above described fast sourcemap
   helpers

### Handling Invalid Sourcemaps

Add `DEBUG='fast-sourcemap-concat:*'` to see error output when invalid
sourcemaps are detected.

## Useful tools

- source map visualizer - https://sokra.github.io/source-map-visualization/ **
  Very useful, but appears to have issues with both large sourcemaps, and
  incorrect sourcemaps (such as ones with unexpected negative offsets).
- encode/decode - https://github.com/krisselden/fast-source-map/tree/master/bin
- srcmap r3 - `https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit`
