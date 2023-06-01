import { HelperLike } from '@glint/template';
<% if (welcome) { %>import EmberWelcomePageRegistry from 'ember-welcome-page/template-registry';
<% } %>
declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry<% if (welcome) { %>
    extends EmberWelcomePageRegistry /* add other addon registries here */<% } %> {
    'page-title': HelperLike<{
      Args: { Positional: [title: string] };
      Return: void;
    }>;
  }
}
