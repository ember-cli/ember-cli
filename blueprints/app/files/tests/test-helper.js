import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';

setResolver(resolver);

document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

QUnit.config.urlConfig.push({ id: 'nocontainer', label: 'Hide container'});
document.getElementById('ember-testing-container').style.visibility =
  (QUnit.config.urlParams.nocontainer ? 'hidden' : 'visible');
