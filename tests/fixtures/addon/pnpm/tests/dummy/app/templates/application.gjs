import pageTitle from 'ember-page-title/helpers/page-title';
import WelcomePage from 'ember-welcome-page/components/welcome-page';

<template>
  {{pageTitle "Dummy"}}

  {{outlet}}

  {{! The following component displays Ember's default welcome message. }}
  <WelcomePage />
  {{! Feel free to remove this! }}
</template>
