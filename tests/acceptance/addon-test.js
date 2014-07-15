'use strict';

var fs        = require('fs-extra');
var ember     = require('../helpers/ember');
var assert    = require('assert');
var forEach   = require('lodash-node/compat/collections/forEach');
var walkSync  = require('walk-sync');
var Blueprint = require('../../lib/models/blueprint');
var path      = require('path');
var tmp       = require('../helpers/tmp');
var root      = process.cwd();
var util      = require('util');
var conf      = require('../helpers/conf');

describe('Acceptance: ember addon ', function() {
  before(conf.setup);

  after(conf.restore);

  beforeEach(function() {
    tmp.setup('./tmp');
    process.chdir('./tmp');
  });

  afterEach(function() {
    tmp.teardown('./tmp');
  });

  function confirmBlueprintedForDir(dir) {
    return function() {
      var blueprintPath = path.join(root, dir, 'files');
      var expected      = walkSync(blueprintPath);
      var actual        = walkSync('.').sort();
      var folder        = path.basename(process.cwd());

      forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
        expected[expected.indexOf(srcFile)] = destFile;
      });

      expected.sort();

      assert.equal(folder, 'foo');
      assert.deepEqual(expected, actual, '\n expected: ' +  util.inspect(expected) +
                       '\n but got: ' +  util.inspect(actual));

    };
  }

  function confirmBlueprinted() {
    return confirmBlueprintedForDir('blueprints/addon');
  }

  it('new foo, where foo does not yet exist, works', function() {
    return ember([
      'addon',
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower'
    ]).then(confirmBlueprinted);
  });

  it('new with empty addon name doesnt throw exception', function() {
    return ember([
      'addon',
      'new',
      ''
    ]);
  });

  it('new without addon name doesnt throw exception', function() {
    return ember([
      'addon',
      'new'
    ]);
  });

  it('new with addon name creates new directory and has a dasherized package name', function() {
    return ember([
      'addon',
      'new',
      'FooAddon',
      '--skip-npm',
      '--skip-bower'
    ]).then(function() {
      assert(!fs.existsSync('FooAddon'));

      var pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      assert.equal(pkgJson.name, 'foo-addon');
    });
  });

  it('Cannot run ember addon new, inside of ember-cli project', function() {
    return ember([
      'addon',
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower'
    ]).then(function() {
      return ember([
        'addon',
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower'
      ]).then(function() {
        assert(!fs.existsSync('foo'));
      });
    }).then(confirmBlueprinted);
  });

  it('new with blueprint uses the specified blueprint directory', function() {
    tmp.setup('./tmp/my_blueprint');
    tmp.setup('./tmp/my_blueprint/files');
    fs.writeFileSync('./tmp/my_blueprint/files/gitignore');
    process.chdir('./tmp');

    return ember([
      'addon',
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--blueprint=my_blueprint'
    ]).then(confirmBlueprintedForDir('tmp/my_blueprint'));
  });
});
