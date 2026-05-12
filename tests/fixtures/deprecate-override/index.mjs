import deprecate from "../../../lib/debug/deprecate.js";

deprecate('you can do this for a while longer eh', false, {
  for: 'ember-cli', // this needs to be ember-cli so that it triggers our internal system
  id: 'deprecate-override-test',
  since: {
    available: '4.0.0',
    enabled: '4.0.0',
  },
  until: '15.0.0',
});

console.log('success');
