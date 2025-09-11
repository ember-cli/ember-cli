'use strict';

const versionUtils = require('../lib/utilities/version-utils');

/**
 * JSDoc plugin to inject Ember CLI version into documentation
 */
exports.handlers = {
  beforeParse: function(e) {
    // Replace {{version}} placeholder with actual version
    const version = versionUtils.emberCLIVersion();
    e.source = e.source.replace(/\{\{version\}\}/g, version);
  }
};

exports.defineTags = function(dictionary) {
  // Define custom tags if needed
  dictionary.defineTag('public', {
    mustHaveValue: false,
    onTagged: function(doclet, tag) {
      doclet.access = 'public';
    }
  });
  
  dictionary.defineTag('private', {
    mustHaveValue: false,
    onTagged: function(doclet, tag) {
      doclet.access = 'private';
    }
  });
};
