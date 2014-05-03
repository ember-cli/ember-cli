document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

import resolver from './helpers/resolver';
import { globalize, setResolver } from 'ember-qunit';

globalize();
setResolver(resolver);

function exists(selector) {
  return !!window.find(selector).length;
}

function getAssertionMessage(actual, expected, message) {
  return message || QUnit.jsDump.parse(expected) + " expected but was " + QUnit.jsDump.parse(actual);
}

function equal(actual, expected, message) {
  message = getAssertionMessage(actual, expected, message);
  QUnit.equal.call(this, actual, expected, message);
}

function strictEqual(actual, expected, message) {
  message = getAssertionMessage(actual, expected, message);
  QUnit.strictEqual.call(this, actual, expected, message);
}

window.exists = exists;
window.equal = equal;
window.strictEqual = strictEqual;
