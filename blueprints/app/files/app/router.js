import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
});

export default Router;
