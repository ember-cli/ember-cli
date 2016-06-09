'use strict';

var Blueprint = require('../../../lib/models/blueprint');
var expect    = require('chai').expect;

describe('blueprint - addon-import', function() {
  describe('fileMapTokens', function() {
    it('generates proper tokens with *-addon blueprints', function() {
      var blueprint = Blueprint.lookup('addon-import');
      var options = {
        inRepoAddon: false,
        project: {
          name: function() {
            return 'my-addon';
          },
          config: function() {
            return {};
          },
          isEmberCLIAddon: function() {
            return true;
          }
        },
        entity: {
          name: 'foo-bar'
        },
        originBlueprintName: 'util-addon',
        pod: false,
        podPath: '',
        dasherizedModuleName: 'foo-bar',
        hasPathToken: true

      };
      var locals, podLocals, fileMapTokens, fileMapTokensPods;
      locals = blueprint.locals(options);
      fileMapTokens = blueprint.fileMapTokens(locals);

      options.locals = locals;

      expect(fileMapTokens.__name__(options)).to.equal('foo-bar');
      expect(fileMapTokens.__path__(options)).to.equal('utils');
      expect(fileMapTokens.__root__(options)).to.equal('app');

      options.pod = true;
      podLocals = blueprint.locals(options);
      fileMapTokensPods = blueprint.fileMapTokens(podLocals);

      expect(fileMapTokensPods.__name__(options)).to.equal('foo-bar');
      expect(fileMapTokensPods.__path__(options)).to.equal('utils');
      expect(fileMapTokensPods.__root__(options)).to.equal('app');

    });
  });
});
