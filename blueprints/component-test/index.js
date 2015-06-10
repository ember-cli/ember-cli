/*jshint node:true*/

var path          = require('path');
var testInfo      = require('../../lib/utilities/test-info');
var stringUtil    = require('../../lib/utilities/string');
var getPathOption = require('../../lib/utilities/get-component-path-option');
var EOL           = require('os').EOL;

module.exports = {
  description: 'Generates a component integration or unit test.',

  availableOptions: [
    {
      name: 'test-type',
      type: ['integration', 'unit'],
      default: 'integration',
      aliases:[
        { 'i': 'integration'},
        { 'u': 'unit'},
        { 'integration': 'integration' },
        { 'unit': 'unit' }
      ]
    }
  ],

  fileMapTokens: function() {
    return {
      __testType__: function(options) {
        return options.locals.testType || 'integration';
      },
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, options.locals.path, options.dasherizedModuleName);
        }
        return 'components';
      }
    };
  },
  locals: function(options) {
    var dasherizedModuleName = stringUtil.dasherize(options.entity.name);
    var componentPathName = dasherizedModuleName;
    var testTypeDefinition = "integration: true";
    var friendlyTestDescription = testInfo.description(options.entity.name, "Integration", "Component");

    if (options.pod && options.path !== 'components' && options.path !== '') {
      componentPathName = [options.path, dasherizedModuleName].join('/');
    }

    if (options.testType === 'unit') {
      testTypeDefinition = "// Specify the other units that are required for this test" +
        EOL + "  // needs: ['component:foo', 'helper:bar']," + EOL + "  unit: true";
        
      friendlyTestDescription = testInfo.description(options.entity.name, "Unit", "Component");
    }

    return {
      path: getPathOption(options),
      testType: options.testType ,
      componentPathName: componentPathName,
      testTypeDefinition: testTypeDefinition,
      friendlyTestDescription: friendlyTestDescription
    };
  }
};
