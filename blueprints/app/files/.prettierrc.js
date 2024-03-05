'use strict';

module.exports = {<% if (templateTag) { %>
  plugins: ['prettier-plugin-ember-template-tag'],<% } %>
  overrides: [
    {
      files: '*.{js,ts<% if (templateTag) { %>,gjs,gts<% } %>}',
      options: {
        singleQuote: true,
      },
    },
  ],
};
