<% if (typescript) { %>
// This "side-effect"-type import provides auto-complete, go-to-def, etc. for
// Ember's internals throughout your application, so don't remove it!
import 'ember-source/types';
<% } else { %>
// This "type definition" import comment provides auto-complete, go-to-def, etc.
// for Ember's internals throughout your application, so don't remove it, even
// if you do not use TypeScript at all.
/**
  @typedef {import('ember-source/types')} Types
*/
<% } %>
