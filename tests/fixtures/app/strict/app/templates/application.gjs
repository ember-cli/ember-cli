import pageTitle from 'ember-page-title/helpers/page-title';
import WelcomePage from 'ember-welcome-page/components/welcome-page';

<template>
  {{pageTitle "Foo"}}

  {{outlet}}

  {{! The following component displays Ember's default welcome message. }}
  <WelcomePage @extension="gjs" />
  {{! Feel free to remove this! }}
</template>
