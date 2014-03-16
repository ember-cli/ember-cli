'use strict';

exports.camelize = function camelize(str) {
  if (!str) {
    return;
  }

  return str.replace(/(?:^|[-_])(\w)/g, function (_, c) {
    return c ? c.toUpperCase () : '';
  });
};

exports.dasherize = function dasherize(str) {
  if (!str) {
    return;
  }

  return exports.humanize(str)
    .replace(/[_ ]/g, '-')
    .toLowerCase();
};

exports.humanize = function humanize(str) {
  if (!str) {
    return;
  }

  return str.replace(/([A-Z])/g, ' $1')
    .trim();
};
