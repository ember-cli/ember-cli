'use strict';

require('../setup');
var path                  = require('path');
var expect                = require('chai').expect;
var stub                  = require('../helpers/stub').stub;
var Blueprint             = require('../../lib/blueprint');
var basicBlueprintPath    = path.join(__dirname, '../fixtures/blueprints/basic');
var basicNewBlueprintPath = path.join(__dirname, '../fixtures/blueprints/basic_2');
var missingBlueprintPath  = path.join(__dirname, '../fixtures/blueprints/__missing__');
var tmp                   = require('../helpers/tmp');
var walkSync              = require('walk-sync');
var MockUI                = require('../helpers/mock-ui');

var basicBlueprintFiles = ['.gitignore', 'test.txt', 'foo.txt'].sort();

function stubBlueprint(structure, ui) {
  var blueprint = new Blueprint(structure, ui);
  stub(blueprint, 'postInstall');
  return blueprint;
}

describe.only('Blueprint', function() {
  var ui;

  it('exists', function() {
    expect(new Blueprint(basicBlueprintPath)).to.exist;
  });

  it('throws when givin unknown blueprintPath', function() {
    expect(function() { new Blueprint(missingBlueprintPath); })
      .to.throw(/Unknown Blueprint:\s/);
  });

  describe('basic blueprint installation', function() {
    var blueprint, postInstall;

    beforeEach(function() {
      tmp.setup('./tmp');
      process.chdir('./tmp');
      ui = new MockUI();
      blueprint = stubBlueprint(basicBlueprintPath, ui);
      postInstall = stub(blueprint, 'postInstall');
    });

    afterEach(function() {
      tmp.teardown('./tmp');
      postInstall.restore();
    });

    it('can install and then re-install identical files', function() {
      return blueprint.install('.').then(function() {
        return blueprint.install('.').then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');
          var expectations = [
            /^installing/,
            /create.* .gitignore/,
            /create.* foo.txt/,
            /create.* test.txt/,
            /^installing/,
            /identical.* .gitignore/,
            /identical.* foo.txt/,
            /identical.* test.txt/
          ]

          expect(output).to.have.length(expectations.length);
          output.map(function(line, index) {
            expect(line).to.match(expectations[index]);
          });
          expect(actualFiles).to.deep.equal(basicBlueprintFiles);
        });
      });
    });

    it('can install and re-installing with conflicting files', function() {
      return blueprint.install('.').then(function() {
        var output = ui.output;

        /*assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* \.gitignore/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);*/

        var blueprintNew = stubBlueprint(basicNewBlueprintPath, ui);
        stub(blueprintNew, 'postInstall');

        //setTimeout(function() { ui.inputStream.write('y\n'); }, 10);
        //setTimeout(function() { ui.inputStream.write('y\n'); }, 20);

        return blueprintNew.install('.').then(function() {
          var actualFiles = walkSync('.').sort();

          /*assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /identical.* \.gitignore/);
          assert.match(output.shift(), /skip.* foo.txt/);
          assert.match(output.shift(), /identical.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);*/
        });
      });
    });
  });
});
