'use strict';

const fs = require('fs-extra');
const ember = require('../helpers/ember');
const experiments = require('../experiments');
const walkSync = require('walk-sync');
const Blueprint = require('../../lib/models/blueprint');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
let root = process.cwd();
const util = require('util');
const EOL = require('os').EOL;
const chalk = require('chalk');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const forEach = require('ember-cli-lodash-subset').forEach;

let tmpDir = './tmp/new-test';

describe('Acceptance: ember new', function() {
  this.timeout(10000);

  beforeEach(function() {
    return tmp.setup(tmpDir)
      .then(function() {
        process.chdir(tmpDir);
      });
  });

  afterEach(function() {
    return tmp.teardown(tmpDir);
  });

  function confirmBlueprintedForDir(dir) {
    return function() {
      let blueprintPath = path.join(root, dir, 'files');
      let expected = walkSync(blueprintPath);
      let actual = walkSync('.').sort();
      let directory = path.basename(process.cwd());

      forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
        expected[expected.indexOf(srcFile)] = destFile;
      });

      expected.sort();

      expect(directory).to.equal('foo');
      expect(expected)
        .to.deep.equal(actual, `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`);

    };
  }

  function confirmBlueprinted() {
    return confirmBlueprintedForDir('blueprints/app');
  }

  it('ember new foo, where foo does not yet exist, works', function() {
    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
    ]).then(confirmBlueprinted);
  });

  it('ember new with empty app name fails with a warning', function() {
    return ember([
      'new',
      '',
    ]).then(function() {
      throw new Error('this promise should be rejected');
    }, function(err) {
      expect(err.name).to.equal('SilentError');
      expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
    });
  });

  it('ember new without app name fails with a warning', function() {
    return ember([
      'new',
    ]).then(function() {
      throw new Error('this promise should be rejected');
    }, function(err) {
      expect(err.name).to.equal('SilentError');
      expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
    });
  });

  it('ember new with app name creates new directory and has a dasherized package name', function() {
    return ember([
      'new',
      'FooApp',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ]).then(function() {
      expect(dir('FooApp')).to.not.exist;
      expect(file('package.json')).to.exist;

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.name).to.equal('foo-app');
    });
  });

  it('Can create new ember project in an existing empty directory', function() {
    fs.mkdirsSync('bar');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]).catch(function(error) {
      throw new Error('this command should work');
    });
  });

  it('Cannot create new ember project in a populated directory', function() {
    fs.mkdirsSync('bar');
    fs.writeFileSync(path.join('bar', 'package.json'), '{}');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]).then(function() {
      throw new Error('this promise should be rejected');
    }).catch(function(error) {
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('Directory \'bar\' already exists.');
    });
  });

  it('Cannot run ember new, inside of ember-cli project', function() {
    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ]).then(function() {
      return ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
      ]).then(function() {
        throw new Error('this promise should be rejected');
      }).catch(function(error) {
        expect(dir('foo')).to.not.exist;
        expect(error.name).to.equal('SilentError');
        expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);
      });
    }).then(confirmBlueprinted);
  });

  it('ember new with blueprint uses the specified blueprint directory with a relative path', function() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]).then(confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint')));
  });

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', function() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      `--blueprint=${path.resolve(process.cwd(), 'my_blueprint')}`,
    ]).then(confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint')));
  });

  it('ember new with git blueprint checks out the blueprint and uses it', function() {
    this.timeout(20000); // relies on GH network stuff

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git',
    ]).then(function() {
      expect(file('.ember-cli')).to.exist;
    });
  });

  if (experiments.NPM_BLUEPRINTS) {
    it('ember new with package blueprint installs the package and uses it', function() {
      this.timeout(20000); // relies on npm over the network

      return ember([
        'new',
        'app-from-npm',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--blueprint=ember-cli-app-blueprint-test',
      ]).then(function() {
        expect(file('.ember-cli')).to.exist;
        expect(file('package.json')).to.contain('"name": "app-from-npm"');
      });
    });
  }

  it('ember new passes blueprint options through to blueprint', function() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/index.js', [
      'module.exports = {',
      '  availableOptions: [ { name: \'custom-option\' } ],',
      '  locals: function(options) {',
      '    return {',
      '      customOption: options.customOption',
      '    };',
      '  }',
      '};',
    ].join('\n'));
    fs.writeFileSync('my_blueprint/files/gitignore', '<%= customOption %>');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
      '--custom-option=customValue',
    ]).then(function() {
      expect(file('.gitignore')).to.contain('customValue');
    });
  });

  it('ember new without skip-git flag creates .git dir', function() {
    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
    ], {
      skipGit: false,
    }).then(function() {
      expect(dir('.git')).to.exist;
    });
  });

  it('ember new cleans up after itself on error', function() {
    fs.mkdirsSync('my_blueprint');
    fs.writeFileSync('my_blueprint/index.js', 'throw("this will break");');

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]).catch(function() {
      expect(dir('foo')).to.not.exist;
    });
  });

  it('ember new with --dry-run does not create new directory', function() {
    return ember([
      'new',
      'foo',
      '--dry-run',
    ]).then(function() {
      expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
      expect(dir('foo')).to.not.exist;
      expect(dir('.git')).to.not.exist;
    });
  });

  it('ember new with --directory uses given directory name and has correct package name', function() {
    let workdir = process.cwd();

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]).then(function() {
      expect(dir(path.join(workdir, 'foo'))).to.not.exist;
      expect(dir(path.join(workdir, 'bar'))).to.exist;

      let cwd = process.cwd();
      expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
      expect(cwd).to.match(/bar/, 'uses given directory name');

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
    });
  });

  it('ember addon with --directory uses given directory name and has correct package name', function() {
    let workdir = process.cwd();

    return ember([
      'addon',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]).then(function() {
      expect(dir(path.join(workdir, 'foo'))).to.not.exist;
      expect(dir(path.join(workdir, 'bar'))).to.exist;

      let cwd = process.cwd();
      expect(cwd).to.not.match(/foo/, 'does not use addon name for directory name');
      expect(cwd).to.match(/bar/, 'uses given directory name');

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.name).to.equal('foo', 'uses addon name for package name');
    });
  });

});
