# ES modules support and `std/esm`

ESM support is slated to land, unflagged, in Node 10. While we definitely want to be compatible with future versions of Node.js, we'd like to use ESM today.

Node has [settled on](https://github.com/nodejs/node-eps/blob/master/002-es-modules.md#32-determining-if-source-is-an-es-module) using the `.mjs` (modular JavaScript) file extension to signal the “module” parse goal but we would like to avoid file extension changes.

Having said that, we chose to use [`@std/esm`](https://www.npmjs.com/package/@std/esm) loader to enable a smooth transition between Node and ES module formats.
