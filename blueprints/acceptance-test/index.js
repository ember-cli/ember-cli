/*jshint node:true*/

var testInfo = require('../../lib/utilities/test-info');
var pathUtil = require('../../lib/utilities/path');

module.exports = {
  description: 'Generates an acceptance test for a feature.',
  locals: function(options) {
    var testFolderRoot = options.dasherizedPackageName;
    if (options.project.isEmberCLIAddon()) {
      testFolderRoot = pathUtil.getRelativeParentPath(options.entity.name, -1);
    }
    return {
      testFolderRoot: testFolderRoot,
      friendlyTestName: testInfo.name(options.entity.name, "Acceptance", null)
    };
  }
};
