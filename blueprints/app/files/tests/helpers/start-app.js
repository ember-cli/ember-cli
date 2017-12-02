import Application from '../../app';
import config from '../../config/environment';
import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';

export default function startApp(attrs) {
  const attributes = assign({}, config.APP, attrs); // use defaults, but you can override;

  return run(() => {
    const application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
    return application;
  });
}
