'use strict';

const minimatch = require('minimatch');
const processTemplate = require('../../lib/utilities/process-template');
const loadDir = require('./load-dir');
const path = require('path');

const isArray = a => Object.prototype.toString.call(a) === '[object Array]';

const emberCLIVersion = require('../../package').version;
const year = (new Date()).getFullYear();

/**
 * @param {(string|string[]|Object[])} fixtures
 * @param {Object} options
 */
module.exports = function loadProjectFixture(fixtures, options) {
  options = options || {};

  options.variables = Object.assign({
    year,
    emberCLIVersion,
  }, options.variables || {});

  if (!isArray(fixtures)) {
    fixtures = [fixtures];
  }

  let fixture = fixtures.reduce((prev, currentFixture) => {
    if (typeof currentFixture === 'string') {
      const fixturePath = path.join(__dirname, `../fixtures/${currentFixture}`);
      currentFixture = Object.assign(prev, loadDir(fixturePath));
    }

    return Object.assign(prev, currentFixture);
  }, {});

  // remove all files that doesn't `files` minimatch patterns
  if (options.files && typeof options.files.length !== 'undefined') {
    const matcher = options.files.length === 1
      ? options.files[0]
      : `{${options.files.join(',')}}`;

    fixture = Object.keys(fixture).reduce((whitelisted, filename) => {
      const isWhitelisted = minimatch(filename, matcher, {
        matchBase: true,
        dot: true,
      });

      if (isWhitelisted) {
        whitelisted[filename] = fixture[filename];
      }

      return whitelisted;
    }, {});
  }

  if (options.patches) {
    fixture = applyPatches(fixture, options.patches);
  }

  fixture = applyVariables(fixture, options.variables);

  return fixture;
};

function applyVariables(fixture, variables) {
  for (let fName in fixture) {
    fixture[fName] = processTemplate(fixture[fName], variables);
  }

  return fixture;
}

function applyPatches(fixture, patches) {
  fixture = JSON.parse(JSON.stringify(fixture));

  for (let filename in patches) {
    const patch = patches[filename];

    if (typeof patch === 'function') {
      fixture[filename] = patch(fixture[filename]);
    } else if ([null, false].indexOf(patch) > -1) {
      delete fixture[filename];
    // @todo: handle `true`
    } else if (typeof patch === 'string') {
      fixture[filename] = patch;
    } else {
      throw new Error('patch must be a function, string or boolean');
    }
  }

  return fixture;
}
