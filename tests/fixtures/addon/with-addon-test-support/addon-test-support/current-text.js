import Ember from 'ember';

const { $ } = Ember;

export default function(application) {
  let rootElement = application.rootElement;

  return $(rootElement).text();
}
