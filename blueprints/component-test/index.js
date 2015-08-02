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
    var testImports = EOL + "import hbs from 'htmlbars-inline-precompile';";
    var testOptions = "integration: true";
    var friendlyTestDescription = testInfo.description(options.entity.name, "Integration", "Component");
    var testContent = "assert.expect(2);" + EOL + EOL +
      "  // Set any properties with this.set('myProperty', 'value');" + EOL +
      "  // Handle any actions with this.on('myAction', function(val) { ... });" + EOL + EOL +
      "  this.render(hbs`{{" + dasherizedModuleName + "}}`);" + EOL + EOL +
      "  assert.equal(this.$().text().trim(), '');" + EOL + EOL +
      "  // Template block usage:" + EOL +
      "  this.render(hbs`" + EOL +
      "    {{#" + dasherizedModuleName + "}}" + EOL +
      "      template block text" + EOL +
      "    {{/" + dasherizedModuleName + "}}" + EOL +
      "  `);" + EOL + EOL +
      "  assert.equal(this.$().text().trim(), 'template block text');";

    if (options.pod && options.path !== 'components' && options.path !== '') {
      componentPathName = [options.path, dasherizedModuleName].join('/');
    }

    if (options.testType === 'unit') {
      testImports = "";
      testOptions = "// Specify the other units that are required for this test" +
        EOL + "  // needs: ['component:foo', 'helper:bar']," + EOL + "  unit: true";

      testContent = "assert.expect(1);" + EOL + EOL +
        "  // Creates the component instance" + EOL +
        "  var component = this.subject();" + EOL +
        "  // Renders the component to the page" + EOL +
        "  this.render();" + EOL +
        "  assert.equal(this.$().text().trim(), '');";

      friendlyTestDescription = testInfo.description(options.entity.name, "Unit", "Component");
    }

    return {
      path: getPathOption(options),
      testType: options.testType,
      testImports: testImports,
      testContent: testContent,
      componentPathName: componentPathName,
      testOptions: testOptions,
      friendlyTestDescription: friendlyTestDescription
    };
  }
};
