// 'use strict';

// var fs        = require('fs-extra');
// var ember     = require('../helpers/ember');
// var assert    = require('assert');
// var forEach   = require('lodash-node/compat/collections/forEach');
// var walkSync  = require('walk-sync');
// var Blueprint = require('../../lib/blueprint');
// var path      = require('path');
// var tmp       = require('../helpers/tmp');
// var root      = process.cwd();
// var util      = require('util');
// var conf      = require('../helpers/conf');

// describe('Acceptance: ember new', function() {
  // before(conf.setup);

  // after(conf.restore);

  // beforeEach(function() {
    // tmp.setup('./tmp');
    // process.chdir('./tmp');
  // });

  // afterEach(function() {
    // tmp.teardown('./tmp');
  // });

  // function confirmBlueprinted() {
    // var folder = path.basename(process.cwd());

    // assert.equal(folder, 'foo');

    // var blueprintPath = path.join(root, 'blueprint');

    // var expected = walkSync(blueprintPath);
    // var actual = walkSync('.').sort();

    // forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      // expected[expected.indexOf(srcFile)] = destFile;
    // });

    // expected.sort();

    // assert.deepEqual(expected, actual, '\n expected: ' +  util.inspect(expected) +
                     // '\n but got: ' +  util.inspect(actual));
  // }

  // it('ember new foo, where foo does not yet exist, works', function() {
    // return ember([
      // 'new',
      // 'foo',
      // '--dry-run'
    // ]).then(confirmBlueprinted);
  // });

  // it('ember new with empty app name doesn\'t throw exception', function() {
    // assert.doesNotThrow(function() {
      // return ember([
        // 'new',
        // ''
      // ]);
    // });
  // });

  // it('ember new without app name doesn\'t throw exception', function() {
    // assert.doesNotThrow(function() {
      // return ember([
        // 'new'
      // ]);
    // });
  // });

  // it('ember new with app name creates new directory and has a dasherized package name', function() {
    // return ember([
      // 'new',
      // 'FooApp',
      // '--dry-run'
    // ]).then(function() {
      // assert(!fs.existsSync('FooApp'));

      // var pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      // assert.equal(pkgJson.name, 'foo-app');
    // });
  // });

  // it('Cannot run ember new, inside of ember-cli project', function() {
    // return ember([
      // 'new',
      // 'foo',
      // '--dry-run'
    // ]).then(function() {
      // return ember([
        // 'new',
        // 'foo',
        // '--dry-run'
      // ]).then(function() {
        // assert(!fs.existsSync('foo'));
      // });
    // }).then(confirmBlueprinted);
  // });
// });
