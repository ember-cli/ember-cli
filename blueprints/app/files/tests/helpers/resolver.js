import Resolver from 'ember/resolver';
import config from '../../config/environment';

var resolver = Resolver.create();

resolver.namespace = {
  modulePrefix: config.modulePrefix
};

export default resolver;
