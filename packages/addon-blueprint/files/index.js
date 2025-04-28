'use strict';

module.exports = {
  name: require('./package').name,<% if (typescript) {%>

  options: {
    'ember-cli-babel': { enableTypeScriptTransform: true },
  },<% } %>
};
