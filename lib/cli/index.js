'use strict';

/*
  In order for us to start using ES modules across the codebase,
  we need to make sure we setup `@std/esm` loader. This file serves
  as an entry point and allows all downstream `require`s to use ESM.
*/

const loader = require('@std/esm')(module);

module.exports = loader('./main.js').default;
