/*jshint node:true*/

var testInfo    = require('ember-cli-test-info');
var pathUtil    = require('ember-cli-path-utils');
var stringUtils = require('ember-cli-string-utils');
var path        = require('path');
var fs          = require('fs');

module.exports = {
  description: 'Generates an acceptance test for a feature.',

  availableOptions: [
    {
      name: '--instance',
      type: Boolean,
      default: false
    }
  ],

  locals: function(options) {
    var metaDir = path.join(__dirname, 'meta');
    var lifeCycleHooksTemplate = 'default';
    var lifeCycleHooksTemplatePath = '';
    var startAppImmports = ['startApp'];
    var testFolderRoot = stringUtils.dasherize(options.project.name());

    if (options.instance) {
      startAppImmports.push('getAppInstance');
      lifeCycleHooksTemplate = 'instance';
    }

    if (options.project.isEmberCLIAddon()) {
      testFolderRoot = pathUtil.getRelativeParentPath(options.entity.name, -1, false);
    }

    lifeCycleHooksTemplatePath = path.join(metaDir, lifeCycleHooksTemplate);

    return {
      testFolderRoot: testFolderRoot,
      imports: startAppImmports.join(', '),
      lifeCycleHooks: fs.readFileSync(lifeCycleHooksTemplatePath, { encoding: 'utf8' }),
      friendlyTestName: testInfo.name(options.entity.name, "Acceptance", null)
    };
  }
};
