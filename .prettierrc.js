'use strict';

module.exports = {
  overrides: [
    {
      files: ['*.js', 'bin/ember'],
      options: {
        singleQuote: true,
      },
    },
  ],
  printWidth: 120,
  trailingComma: 'es5',
};
