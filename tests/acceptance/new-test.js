'use strict';

var fs         = require('fs-extra');
var ember      = require('../helpers/ember');
var existsSync = require('exists-sync');
var forEach    = require('lodash/forEach');
var walkSync   = require('walk-sync');
var Blueprint  = require('../../lib/models/blueprint');
var path       = require('path');
var tmp        = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
var root       = process.cwd();
var util       = require('util');
var conf       = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var EOL        = require('os').EOL;
var chalk      = require('chalk');
var Promise    = require('../../lib/ext/promise');
var mkdir      = Promise.denodeify(fs.mkdir);

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember new', function() {
  this.timeout(10000);
  before(conf.setup);

  after(conf.restore);

  beforeEach(function() {
    return tmp.setup('./tmp')
      .then(function() {
        process.chdir('./tmp');
      });
  });

  afterEach(function() {
    return tmp.teardown('./tmp');
  });

  function confirmBlueprintedForDir(dir) {
    return function() {
      var blueprintPath = path.join(root, dir, 'files');
      var expected      = walkSync(blueprintPath);
      var actual        = walkSync('.').sort();
      var directory     = path.basename(process.cwd());

      forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
        expected[expected.indexOf(srcFile)] = destFile;
      });

      expected.sort();

      expect(directory).to.equal('foo');
      expect(expected).to.deep.equal(actual, EOL + ' expected: ' +  util.inspect(expected) +
                                             EOL + ' but got: ' +  util.inspect(actual));

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
      '--skip-bower'
    ]).then(confirmBlueprinted);
  });

  it('ember new with empty app name fails with a warning', function() {
    return ember([
      'new',
      ''
    ]).then(function() {
      throw new Error('this promise should be rejected');
    }, function(err) {
      expect(err.name).to.equal('SilentError');
      expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
    });
  });

  it('ember new without app name fails with a warning', function() {
    return ember([
      'new'
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
      '--skip-git'
    ]).then(function() {
      expect(existsSync('FooApp')).to.be.false;

      var pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(pkgJson.name).to.equal('foo-app');
    });
  });

  it('Cannot create new ember project with the same name as an existing directory', function() {

    return mkdir('foo').then(function() {
      return ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git'
      ]).then(function() {
        throw new Error('this promise should be rejected');
      }).catch(function(error) {
        expect(error.name).to.equal('SilentError');
        expect(error.message).to.equal('Directory \'foo\' already exists.');
      });
    });
  });

  it('Cannot run ember new, inside of ember-cli project', function() {
    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git'
    ]).then(function() {
      return ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git'
      ]).then(function() {
        throw new Error('this promise should be rejected');
      }).catch(function(error) {
        expect(existsSync('foo')).to.be.false;
        expect(error.name).to.equal('SilentError');
        expect(error.message).to.equal('You cannot use the ' + chalk.green('new') + ' command inside an ember-cli project.');
      });
    }).then(confirmBlueprinted);
  });

  it('ember new with blueprint uses the specified blueprint directory with a relative path', function() {
    return tmp.setup('./tmp/my_blueprint')
      .then(function() {
        return tmp.setup('./tmp/my_blueprint/files');
      })
      .then(function() {
        fs.writeFileSync('./tmp/my_blueprint/files/gitignore');
        process.chdir('./tmp');

        return ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--blueprint=./my_blueprint'
        ]);
      })
      .then(confirmBlueprintedForDir('tmp/my_blueprint'));
  });

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', function() {
    return tmp.setup('./tmp/my_blueprint')
      .then(function() {
        return tmp.setup('./tmp/my_blueprint/files');
      })
      .then(function() {
        fs.writeFileSync('./tmp/my_blueprint/files/gitignore');
        process.chdir('./tmp');

        return ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--blueprint=' + path.resolve(process.cwd(), './my_blueprint')
        ]);
      })
      .then(confirmBlueprintedForDir('tmp/my_blueprint'));
  });


  it('ember new with git blueprint checks out the blueprint and uses it', function() {
    this.timeout(20000); // relies on GH network stuff

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git'
    ]).then(function() {
      expect(existsSync('.ember-cli')).to.be.true;
    });
  });

  it('ember new passes blueprint options through to blueprint', function() {
    return tmp.setup('./tmp/my_blueprint')
      .then(function() {
        return tmp.setup('./tmp/my_blueprint/files');
      })
      .then(function() {
        fs.writeFileSync('./tmp/my_blueprint/index.js', [
          'module.exports = {',
          '  availableOptions: [ { name: \'custom-option\' } ],',
          '  locals: function(options) {',
          '    return {',
          '      customOption: options.customOption',
          '    };',
          '  }',
          '};'
        ].join('\n'));
        fs.writeFileSync('./tmp/my_blueprint/files/gitignore', '<%= customOption %>');

        process.chdir('./tmp');

        return ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--blueprint=./my_blueprint',
          '--custom-option=customValue'
        ]);
      })
      .then(function() {
        expect(file('.gitignore')).to.contain('customValue');
      });
  });

  it('ember new without skip-git flag creates .git dir', function() {
    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower'
    ], {
      skipGit: false
    }).then(function() {
      expect(existsSync('.git'), '.git folder exists').to.be.true;
    });
  });

  it('ember new cleans up after itself on error', function() {
    return tmp.setup('./tmp/my_blueprint')
      .then(function() {
        fs.writeFileSync('./tmp/my_blueprint/index.js', 'throw("this will break");');
        process.chdir('./tmp');

        return ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--blueprint=./my_blueprint'
        ]);
      })
      .then(function() {
        var cwd = process.cwd();
        expect(existsSync(path.join(cwd, 'foo')), 'the generated directory is removed').to.be.false;
      });
  });

  it('ember new with --dry-run does not create new directory', function() {
    return ember([
      'new',
      'foo',
      '--dry-run'
    ]).then(function() {
      var cwd = process.cwd();
      expect(cwd).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
      expect(existsSync(path.join(cwd, 'foo')), 'does not create new directory').to.be.false;
      expect(existsSync(path.join(cwd, '.git')), 'does not create git in current directory').to.be.false;
    });
  });

  it('ember new with --directory uses given directory name and has correct package name', function() {
    var workdir = process.cwd();

    return ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar'
    ]).then(function() {
      expect(existsSync(path.join(workdir, 'foo')), 'directory with app name exists').to.be.false;
      expect(existsSync(path.join(workdir, 'bar')), 'directory with specified name exists').to.be.true;

      var cwd = process.cwd();
      expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
      expect(cwd).to.match(/bar/, 'uses given directory name');

      var pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
    });
  });
});
