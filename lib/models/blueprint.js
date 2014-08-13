'use strict';
var FileInfo    = require('./file-info');
var Promise     = require('../ext/promise');
var any         = require('lodash-node/compat/collections/some');
var chalk       = require('chalk');
var fs          = require('fs-extra');
var glob        = require('glob');
var merge       = require('lodash-node/compat/objects/merge');
var minimatch   = require('minimatch');
var path        = require('path');
var sequence    = require('../utilities/sequence');
var stat        = Promise.denodeify(fs.stat);
var stringUtils = require('../utilities/string');
var uniq        = require('lodash-node/compat/arrays/uniq');
var walkSync    = require('walk-sync');
var writeFile   = Promise.denodeify(fs.outputFile);
var removeFile  = Promise.denodeify(fs.remove);
var SilentError = require('../errors/silent');

module.exports = Blueprint;

/*
  @class Blueprint
  @extends CoreObject
  @param {String} [blueprintPath]

  A `Blueprint` is a bundle of template files with optional
  install logic. Ember CLI uses blueprints to generate new
  projects via `ember new` and `ember init`, and project
  resources via `ember generate`.

  Blueprints follow a simple structure. Let's take the built-in
  `controller` blueprint as an example:

  ```
  blueprints/controller
  ├── files
  │   ├── app
  │   │   └── controllers
  │   │       └── __name__.js
  │   └── tests
  │       └── unit
  │           └── controllers
  │               └── __name__-test.js
  └── index.js
  ```

  ## Files

  `files` contains templates for the all the files to be
  installed into the target directory.

  The `__name__` placeholder is subtituted with the dasherized
  entity name at install time. For example, when the user
  invokes `ember generate controller foo` then `__name__` becomes
  `foo`.

  ## Template Variables (AKA Locals)

  Variables can be inserted into templates with
  `<%= someVariableName %>`.

  For example, in the built-in `util` blueprint
  `files/app/utils/__name__.js` looks like this:

  ```js
  export default function <%= camelizedModuleName %>() {
    return true;
  }
  ```

  `<%= camelizedModuleName %>` is replaced with the real
  value at install time.

  The following template variables provided by default:

  - `dasherizedPackageName`
  - `classifiedPackageName`
  - `dasherizedModuleName`
  - `classifiedModuleName`
  - `camelizedModuleName`

  `packageName` is the project name as found in the project's
  `package.json`.

  `moduleName` is the name of the entity being generated.

  The mechanism for providing custom template variables is
  described below.

  ## Index.js

  `index.js` contains a subclass of `Blueprint`. Use this
  to customize installation behaviour.

  ```js
  var Blueprint = require('ember-cli/lib/models/blueprint');

  module.exports = Blueprint.extend({
    locals: function(options) {
      // Return custom template variables here.
      return {};
    },

    afterInstall: function(options) {
      // Perform extra work here.
    }
  });
  ```

  As shown above, there are two hooks available:
  `locals` and `afterInstall`.

  ## Locals

  Use `locals` to add custom tempate variables. The method
  recieves one argument: `options`. Options is an object
  containing general and entity-specific install options.

  When the following is called on the command line:

  ```sh
  $ ember generate controller foo type:array --dry-run
  ```

  The object passed to `locals` looks like this:

  ```js
  {
    entity: {
      name: 'foo',
      options: {
        type: 'array'
      }
    },
    dryRun: true
  }
  ```

  This hook must return an object. It will be merged with the
  aforementioned default locals.

  ## afterInstall

  The `afterInstall` hook receives the same options as `locals`.
  Use it to perform any custom work after the files are
  installed. For example, the built-in `route` blueprint uses
  the `afterInstall` hook to add relevant route declarations
  to `app/router.js`.

  ## Overriding Install

  If you don't want your blueprint to install the contents of
  `files` you can override the `install` method. It receives the
  same `options` object described above and must return a promise.
  See the built-in `resource` blueprint for an example of this.

*/
function Blueprint(blueprintPath) {
  this.path = blueprintPath;
  this.name = path.basename(blueprintPath);
}

Blueprint.__proto__ = require('./core-object');
Blueprint.prototype.constructor = Blueprint;

/*
  @method files
  @return {Array} Contents of the blueprint's files directory
*/
Blueprint.prototype.files = function() {
  if (this._files) { return this._files; }

  return this._files = walkSync(path.join(this.path, 'files'));
};

/*
  @method srcPath
  @param {String} file
  @return {String} Resolved path to the file
*/
Blueprint.prototype.srcPath = function(file) {
  return path.resolve(this.path, 'files', file);
};

/*
  Hook for normalizing entity name
  @method normalizeEntityName
  @param {String} entityName
  @return {null}
*/
Blueprint.prototype.normalizeEntityName = function(entityName) {
  if (!entityName) {
    throw new SilentError('The `ember generate` command requires an ' +
                          'entity name to be specified. ' +
                          'For more details, use `ember help`.\n');
  }

  var trailingSlash = /(\/$|\\$)/;
  if(trailingSlash.test(entityName)) {
    throw new Error('You specified "' + entityName + '", but you can\'t use a ' +
                    'trailing slash as an entity name with generators. Please ' +
                    're-run the command with "' + entityName.replace(trailingSlash, '') + '".\n');
  }

  return entityName;
};

/*
  @method install
  @param {Object} options
  @return {Promise}
*/
Blueprint.prototype.install = function(options) {
  var ui       = this.ui = options.ui;
  var intoDir  = options.target;
  var dryRun   = options.dryRun;
  var locals   = this._locals(options);
  this.project = options.project;
  this.testing = options.testing;

  var actions = {
    write: function(info) {
      ui.write('  ' + chalk.green('create') + ' ' + info.displayPath + '\n');
      if (!dryRun) {
        return writeFile(info.outputPath, info.render());
      }
    },

    skip: function(info) {
      var label = 'skip';

      if (info.resolution === 'identical') {
        label = 'identical';
      }

      ui.write('  ' + chalk.yellow(label) + ' ' + info.displayPath + '\n');
    },

    overwrite: function(info) {
      ui.write('  ' + chalk.yellow('overwrite') + ' ' + info.displayPath + '\n');
      if (!dryRun) {
        return writeFile(info.outputPath, info.render());
      }
    },

    edit: function(info) {
      ui.write('  ' + chalk.green('edited') + ' ' + info.displayPath + '\n');
    }
  };

  function commit(result) {
    var action = actions[result.action];

    if (action) {
      return action(result);
    } else {
      throw new Error('Tried to call action \"' + result.action + '\" but it does not exist');
    }
  }

  ui.write('installing\n');

  if (dryRun) {
    ui.write(chalk.yellow('You specified the dry-run flag, so no changes will be written.\n'));
  }

  if(options.entity) {
    options.entity.name = this.normalizeEntityName(options.entity.name);
  }

  return Promise.resolve()
    .then(this.beforeInstall.bind(this, options))
    .then(this.processFiles.bind(this, intoDir, locals)).map(commit)
    .then(this.afterInstall.bind(this, options));
};

/*
  @method uninstall
  @param {Object} options
  @return {Promise}
*/
Blueprint.prototype.uninstall = function(options) {
  var ui          = this.ui = options.ui;
  var intoDir     = options.target;
  var dryRun      = options.dryRun;
  var packageName = options.project.name();
  var moduleName  = options.entity && options.entity.name || packageName;
  var locals      = { dasherizedModuleName: stringUtils.dasherize(moduleName) };
  this.project    = options.project;

  var actions = {
    remove: function(info) {
      ui.write('  ' + chalk.red('remove') + ' ' + info.displayPath + '\n');
      if (!dryRun) {
        return removeFile(info.outputPath);
      }
    }
  };

  function commit(result) {
    var action = actions[result.action];

    if (action) {
      return action(result);
    } else {
      throw new Error('Tried to call action \"' + result.action + '\" but it does not exist');
    }
  }

  ui.write('uninstalling\n');

  if (dryRun) {
    ui.write(chalk.yellow('You specified the dry-run flag, so no files will be deleted.\n'));
  }

  if(options.entity) {
    options.entity.name = this.normalizeEntityName(options.entity.name);
  }

  return Promise.resolve()
    .then(this.beforeUninstall.bind(this, options))
    .then(this.processFilesForUninstall.bind(this, intoDir, locals)).map(commit)
    .then(this.afterUninstall.bind(this, options));
};

/*
  Hook for running operations before install.
  @method beforeInstall
  @return {Promise|null}
*/
Blueprint.prototype.beforeInstall = function() {};

/*
  Hook for running operations after install.
  @method afterInstall
  @return {Promise|null}
*/
Blueprint.prototype.afterInstall = function() {};

/*
  Hook for running operations before uninstall.
  @method beforeUninstall
  @return {Promise|null}
*/
Blueprint.prototype.beforeUninstall = function() {};

/*
  Hook for running operations after uninstall.
  @method afterUninstall
  @return {Promise|null}
*/
Blueprint.prototype.afterUninstall = function() {};

/*
  Hook for adding additional locals
  @method locals
  @return {Object|null}
*/
Blueprint.prototype.locals = function() {};

/*
  @method buildFileInfo
  @param {Function} destPath
  @param {Object} templateVariables
  @param {String} file
  @return {FileInfo}
*/
Blueprint.prototype.buildFileInfo = function(destPath, templateVariables, file) {
  var mappedPath = this.mapFile(file, templateVariables);

  return new FileInfo({
    action: 'write',
    outputPath: destPath(mappedPath),
    displayPath: mappedPath,
    inputPath: this.srcPath(file),
    templateVariables: templateVariables,
    ui: this.ui
  });
};

/*
  @method isUpdate
  @return {Boolean}
*/
Blueprint.prototype.isUpdate = function() {
  if (this.project && this.project.isEmberCLIProject) {
    return this.project.isEmberCLIProject();
  }
};

/*
  @method processFiles
  @param {String} intoDir
  @param {Object} templateVariables
*/
Blueprint.prototype.processFiles = function(intoDir, templateVariables) {
  function destPath(file) {
    return path.join(intoDir, file);
  }

  var fileInfos = this.files().
    map(this.buildFileInfo.bind(this, destPath, templateVariables));

  if (this.isUpdate()) {
    Blueprint.ignoredFiles = Blueprint.ignoredFiles.concat(Blueprint.ignoredUpdateFiles);
  }

  function isValidFile(fileInfo) {
    if (isIgnored(fileInfo)) {
      return Promise.resolve(false);
    } else {
      return isFile(fileInfo);
    }
  }

  return Promise.filter(fileInfos, isValidFile).
    map(prepareConfirm).
    then(function(infos) {
      infos.forEach(markIdenticalToBeSkipped);

      var infosNeedingConfirmation = infos.reduce(gatherConfirmationMessages, []);

      return sequence(infosNeedingConfirmation).returns(infos);
    });
};

/*
  @method processFilesForUninstall
  @param {String} intoDir
  @param {Object} templateVariables
*/
Blueprint.prototype.processFilesForUninstall = function(intoDir, templateVariables) {
  function destPath(file) {
    return path.join(intoDir, file);
  }

  var fileInfos = this.files().
    map(this.buildFileInfo.bind(this, destPath, templateVariables));

  if (this.isUpdate()) {
    Blueprint.ignoredFiles = Blueprint.ignoredFiles.concat(Blueprint.ignoredUpdateFiles);
  }

  function isValidFile(fileInfo) {
    if (isIgnored(fileInfo)) {
      return Promise.resolve(false);
    } else {
      return isFile(fileInfo);
    }
  }

  return Promise.filter(fileInfos, isValidFile).then(function(infos) {
      infos.forEach(function(info) {
        info.action = 'remove';
      });
      return infos;
    });
};


/*
  @method mapFile
  @param {String} file
  @return {String}
*/
Blueprint.prototype.mapFile = function(file, locals) {
  file = Blueprint.renamedFiles[file] || file;
  return file.replace(/__name__/g, locals.dasherizedModuleName);
};

/*
  @private
  @method _locals
  @param {Object} options
  @return {Object}
*/
Blueprint.prototype._locals = function(options) {
  var packageName = options.project.name();
  var moduleName = options.entity && options.entity.name || packageName;

  var sanitizedModuleName = moduleName.replace(/\//g, '-');

  var standardLocals = {
    dasherizedPackageName: stringUtils.dasherize(packageName),
    classifiedPackageName: stringUtils.classify(packageName),
    dasherizedModuleName: stringUtils.dasherize(moduleName),
    classifiedModuleName: stringUtils.classify(sanitizedModuleName),
    camelizedModuleName: stringUtils.camelize(sanitizedModuleName)
  };

  var customLocals = this.locals(options);

  return merge({}, standardLocals, customLocals);
};

/*
  Used to add a package to the projects `package.json`.

  Generally, this would be done from the `afterInstall` hook, to
  ensure that a package that is required by a given blueprint is
  available.

  @method addPackageToProject
  @param {String} packageName
  @param {String} version
  @return {Promise}
*/
Blueprint.prototype.addPackageToProject = function(packageName, version) {
  var command = 'npm install --save-dev ' + packageName;
  var ui      = this.ui;

  if (version) {
    command += '@' + version;
  }

  if (ui) {
    ui.write('  ' + chalk.green('install package') + ' ' + packageName + '\n');
  }

  return this._exec(command);
};

/*
  @private
  @method _exec
  @param {String} command
  @return {Promise}
*/
Blueprint.prototype._exec = function(command) {
  var exec = Promise.denodeify(require('child_process').exec);

  if (this.testing) {
    return Promise.resolve();
  } else {
    return exec(command);
  }
};

/*
  @static
  @method lookup
  @namespace Blueprint
  @param {String} [name]
  @param {Object} [options]
  @param {Array} [options.paths] Extra paths to search for blueprints
  @param {Object} [options.properties] Properties
  @return {Blueprint}
*/
Blueprint.lookup = function(name, options) {
  options = options || {};

  var lookupPaths = generateLookupPaths(options.paths);

  var lookupPath;
  var blueprintPath;
  var constructorPath;
  var blueprintModule;
  var Constructor;

  for (var i = 0; lookupPath = lookupPaths[i]; i++) {
    blueprintPath = path.resolve(lookupPath, name);

    if (!fs.existsSync(blueprintPath)) {
      continue;
    }

    constructorPath = path.resolve(blueprintPath, 'index.js');

    if (fs.existsSync(constructorPath)) {
      blueprintModule = require(constructorPath);

      if (typeof blueprintModule === 'function') {
        Constructor = blueprintModule;
      } else {
        Constructor = Blueprint.extend(blueprintModule);
      }
    } else {
      Constructor = Blueprint;
    }

    return new Constructor(blueprintPath);
  }

  throw new SilentError('Unknown blueprint: ' + name);
};

/*
  @static
  @method list
  @namespace Blueprint
  @param {Object} [options]
  @param {Array} [options.paths] Extra paths to search for blueprints
  @return {Blueprint}
*/
Blueprint.list = function(options) {
  options = options || {};

  var lookupPaths = generateLookupPaths(options.paths);

  return lookupPaths.map(function(lookupPath) {
    var source = path.basename(path.join(lookupPath, '..'));

    var blueprints = glob.sync(path.join(lookupPath, '*'));
    blueprints = blueprints.map(function(blueprint) {
      return path.basename(blueprint);
    });

    return {
      source: source,
      blueprints: blueprints
    };
  });
};

/*
  @static
  @property renameFiles
*/
Blueprint.renamedFiles = {
  'gitignore': '.gitignore'
};

/*
  @static
  @property ignoredFiles
*/
Blueprint.ignoredFiles = [
  '.DS_Store'
];

/*
  @static
  @property ignoredUpdateFiles
*/
Blueprint.ignoredUpdateFiles = [
  '.gitkeep',
  'app.css'
];

/*
  @static
  @property defaultLookupPaths
*/
Blueprint.defaultLookupPaths = function() {
  return [
    path.resolve(__dirname, '..', '..', 'blueprints')
  ];
};

/*
  @private
  @method prepareConfirm
  @param {FileInfo} info
  @return {Promise}
*/
function prepareConfirm(info) {
  return info.checkForConflict().then(function(resolution) {
    info.resolution = resolution;
    return info;
  });
}

/*
  @private
  @method markIdenticalToBeSkipped
  @param {FileInfo} info
*/
function markIdenticalToBeSkipped(info) {
  if (info.resolution === 'identical') {
    info.action = 'skip';
  }
}

/*
  @private
  @method gatherConfirmationMessages
  @param {Array} collection
  @param {FileInfo} info
  @return {Array}
*/
function gatherConfirmationMessages(collection, info) {
  if (info.resolution === 'confirm') {
    collection.push(info.confirmOverwriteTask());
  }
  return collection;
}

/*
  @private
  @method isFile
  @param {FileInfo} info
  @return {Boolean}
*/
function isFile(info) {
  return stat(info.inputPath).invoke('isFile');
}

/*
  @private
  @method isIgnored
  @param {FileInfo} info
  @return {Boolean}
*/
function isIgnored(info) {
  var fn = info.inputPath;

  return any(Blueprint.ignoredFiles, function(ignoredFile) {
    return minimatch(fn, ignoredFile, { matchBase: true });
  });
}

/*
  Combines provided lookup paths with defaults and removes
  duplicates.

  @private
  @method generateLookupPaths
  @param {Array} lookupPaths
  @return {Array}
*/
function generateLookupPaths(lookupPaths) {
  lookupPaths = lookupPaths || [];
  lookupPaths = lookupPaths.concat(Blueprint.defaultLookupPaths());
  return uniq(lookupPaths);
}
