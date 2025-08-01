'use strict';

/**
@module ember-cli
*/
const FileInfo = require('@ember-tooling/blueprint-model/utilities/file-info');
const chalk = require('chalk');
const MarkdownColor = require('../utilities/markdown-color');
const sequence = require('../utilities/sequence');
const printCommand = require('../utilities/print-command');
const insertIntoFile = require('../utilities/insert-into-file');
const cleanRemove = require('../utilities/clean-remove');
const fs = require('fs-extra');
const inflector = require('inflection');
const minimatch = require('minimatch');
const path = require('path');
const stringUtils = require('ember-cli-string-utils');
const merge = require('lodash/merge');
const zipObject = require('lodash/zipObject');
const intersection = require('lodash/intersection');
const cloneDeep = require('lodash/cloneDeep');
const compact = require('lodash/compact');
const uniq = require('lodash/uniq');
const sortBy = require('lodash/sortBy');
const walkSync = require('walk-sync');
const SilentError = require('silent-error');
const CoreObject = require('core-object');
const EOL = require('os').EOL;
const logger = require('heimdalljs-logger')('ember-cli:blueprint');
const normalizeEntityName = require('ember-cli-normalize-entity-name');
const isAddon = require('../utilities/is-addon');

const initialIgnoredFiles = ['.DS_Store'];

/**
  A blueprint is a bundle of template files with optional install
  logic.

  Blueprints follow a simple structure. Let's take the built-in
  `controller` blueprint as an example:

  ```
  blueprints/controller
  ├── files
  │   ├── app
  │   │   └── __path__
  │   │       └── __name__.js
  └── index.js

  blueprints/controller-test
  ├── files
  │   └── tests
  │       └── unit
  │           └── controllers
  │               └── __test__.js
  └── index.js
  ```

  ## Files

  `files` contains templates for the all the files to be
  installed into the target directory.

  The `__name__` token is subtituted with the dasherized
  entity name at install time. For example, when the user
  invokes `ember generate controller foo` then `__name__` becomes
  `foo`. When the `--pod` flag is used, for example `ember
  generate controller foo --pod` then `__name__` becomes
  `controller`.

  The `__path__` token is substituted with the blueprint
  name at install time. For example, when the user invokes
  `ember generate controller foo` then `__path__` becomes
  `controller`. When the `--pod` flag is used, for example
  `ember generate controller foo --pod` then `__path__`
  becomes `foo` (or `<podModulePrefix>/foo` if the
  podModulePrefix is defined). This token is primarily for
  pod support, and is only necessary if the blueprint can be
  used in pod structure. If the blueprint does not require pod
  support, simply use the blueprint name instead of the
  `__path__` token.

  The `__test__` token is substituted with the dasherized
  entity name and appended with `-test` at install time.
  This token is primarily for pod support and only necessary
  if the blueprint requires support for a pod structure. If
  the blueprint does not require pod support, simply use the
  `__name__` token instead.

  ## Template Variables (AKA Locals)

  Variables can be inserted into templates with
  `<%= someVariableName %>`.

  For example, the built-in `util` blueprint
  `files/app/utils/__name__.js` looks like this:

  ```js
  export default function <%= camelizedModuleName %>() {
    return true;
  }
  ```

  `<%= camelizedModuleName %>` is replaced with the real
  value at install time.

  The following template variables are provided by default:

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

  Custom installation and uninstallation behavior can be added
  by overriding the hooks documented below. `index.js` should
  export a plain object, which will extend the prototype of the
  `Blueprint` class. If needed, the original `Blueprint` prototype
  can be accessed through the `_super` property.

  ```js
  module.exports = {
    locals(options) {
      // Return custom template variables here.
      return {};
    },

    normalizeEntityName(entityName) {
      // Normalize and validate entity name here.
      return entityName;
    },

    fileMapTokens(options) {
      // Return custom tokens to be replaced in your files
      return {
        __token__(options){
          // logic to determine value goes here
          return 'value';
        }
      }
    },

    filesPath(options) {
      return path.join(this.path, 'files');
    },

    beforeInstall(options) {},
    afterInstall(options) {},
    beforeUninstall(options) {},
    afterUninstall(options) {}

  };
  ```

  ## Blueprint Hooks

  ### beforeInstall & beforeUninstall

  Called before any of the template files are processed and receives
  the `options` and `locals` hashes as parameters. Typically used for
  validating any additional command line options or for any asynchronous
  setup that is needed.   As an example, the `controller` blueprint validates
  its `--type` option in this hook.  If you need to run any asynchronous code,
  wrap it in a promise and return that promise from these hooks.  This will
  ensure that your code is executed correctly.

  ### afterInstall & afterUninstall

  The `afterInstall` and `afterUninstall` hooks receives the same
  arguments as `locals`. Use it to perform any custom work after the
  files are processed. For example, the built-in `route` blueprint
  uses these hooks to add and remove relevant route declarations in
  `app/router.js`.

  ### Overriding Install

  If you don't want your blueprint to install the contents of
  `files` you can override the `install` method. It receives the
  same `options` object described above and must return a promise.
  See the built-in `resource` blueprint for an example of this.

  @class Blueprint
  @constructor
  @extends CoreObject
  @param {String} [blueprintPath]
  @param {Object} [blueprintOptions]
*/
let Blueprint = CoreObject.extend({
  availableOptions: [],
  anonymousOptions: ['name'],

  _printableProperties: ['name', 'description', 'availableOptions', 'anonymousOptions', 'overridden'],

  /**
    Indicates whether or not a blueprint is a candidate for automatic transpilation from TS to JS.
    This property could be false in the case that the blueprint is written in JS and is not intended
    to work with TS at all, OR in the case that the blueprint is written in TS and the author does
    not intend to support transpilation to JS.

    @public
    @property shouldTransformTypeScript
    @type Boolean
  */
  shouldTransformTypeScript: false,

  init(blueprintPath, blueprintOptions) {
    this._super();

    this.path = blueprintPath;
    this.name = blueprintOptions?.name ?? path.basename(blueprintPath);

    this._processOptions(blueprintOptions);
  },

  /**
    Process the options object coming from either
    the `init`, `install` or `uninstall` hook.

    @private
    @method _processOptions
    @param {Object} options
  */
  _processOptions(options = {}) {
    this.options = options;
    this.dryRun = options.dryRun;
    this.pod = options.pod;
    this.project = options.project;
    this.ui = options.ui;
  },

  /**
    Hook to specify the path to the blueprint's files. By default this is
    `path.join(this.path, 'files)`.

    This can be used to customize which set of files to install based on options
    or environmental variables. It defaults to the `files` directory within the
    blueprint's folder.

    @public
    @method filesPath
    @param {Object} options
    @return {String} Path to the blueprints files directory.
  */
  filesPath(/* options */) {
    return path.join(this.path, 'files');
  },

  /**
    Used to retrieve files for blueprint.

    @public
    @method files
    @param {Object} options
    @return {Array} Contents of the blueprint's files directory
  */
  files(/* options */) {
    if (this._files) {
      return this._files;
    }

    let filesPath = this.filesPath(this.options);
    if (Blueprint._existsSync(filesPath)) {
      this._files = walkSync(filesPath);
    } else {
      this._files = [];
    }

    return this._files;
  },

  /**
    @method srcPath
    @param {String} file
    @return {String} Resolved path to the file
  */
  srcPath(file) {
    return path.resolve(this.filesPath(this.options), file);
  },

  /**
    Hook for normalizing entity name

    Use the `normalizeEntityName` hook to add custom normalization and
    validation of the provided entity name. The default hook does not
    make any changes to the entity name, but makes sure an entity name
    is present and that it doesn't have a trailing slash.

    This hook receives the entity name as its first argument. The string
    returned by this hook will be used as the new entity name.

    @public
    @method normalizeEntityName
    @param {String} entityName
    @return {null}
  */
  normalizeEntityName(entityName) {
    return normalizeEntityName(entityName);
  },

  /**
    Write a status and message to the UI
    @private
    @method _writeStatusToUI
    @param {Function} chalkColor
    @param {String} keyword
    @param {String} message
  */
  _writeStatusToUI(chalkColor, keyword, message) {
    if (this.ui) {
      this.ui.writeLine(`  ${chalkColor(keyword)} ${message}`);
    }
  },

  /**
    @private
    @method _writeFile
    @param {Object} info
    @return {Promise}
  */
  async _writeFile(info) {
    if (!this.dryRun) {
      return fs.outputFile(info.outputPath, await info.render());
    }
  },

  /**
    Actions lookup
    @private
    @property _actions
    @type Object
  */
  _actions: {
    write(info) {
      this._writeStatusToUI(chalk.green, 'create', info.displayPath);
      return this._writeFile(info);
    },
    skip(info) {
      let label = 'skip';

      if (info.resolution === 'identical') {
        label = 'identical';
      }

      this._writeStatusToUI(chalk.yellow, label, info.displayPath);
    },

    overwrite(info) {
      this._writeStatusToUI(chalk.yellow, 'overwrite', info.displayPath);
      return this._writeFile(info);
    },

    edit(info) {
      this._writeStatusToUI(chalk.green, 'edited', info.displayPath);
    },

    remove(info) {
      this._writeStatusToUI(chalk.red, 'remove', info.displayPath);
      if (!this.dryRun) {
        return cleanRemove(info);
      }
    },
  },

  /**
    Calls an action.
    @private
    @method _commit
    @param {Object} result
    @return {Promise}
    @throws {Error} Action doesn't exist.
  */
  _commit(result) {
    let action = this._actions[result.action];

    if (action) {
      return action.call(this, result);
    } else {
      throw new Error(`Tried to call action "${result.action}" but it does not exist`);
    }
  },

  /**
    Prints warning for pod unsupported.
    @private
    @method _checkForPod
  */
  _checkForPod(verbose) {
    if (!this.hasPathToken && this.pod && verbose) {
      this.ui.writeLine(
        chalk.yellow(
          'You specified the pod flag, but this' +
            ' blueprint does not support pod structure. It will be generated with' +
            ' the default structure.'
        )
      );
    }
  },

  /**
    @private
    @method _normalizeEntityName
    @param {Object} entity
  */
  _normalizeEntityName(entity) {
    if (entity) {
      entity.name = this.normalizeEntityName(entity.name);
    }
  },

  /**
    @private
    @method _checkInRepoAddonExists
    @param {Object} options
  */
  _checkInRepoAddonExists(options) {
    let addon;

    if (options.inRepoAddon) {
      addon = findAddonByName(this.project, options.inRepoAddon);

      if (!addon) {
        throw new SilentError(
          `You specified the 'in-repo-addon' flag, but the ` +
            `in-repo-addon '${options.inRepoAddon}' does not exist. Please check the name and try again.`
        );
      }
    }

    if (options.in) {
      if (!ensureTargetDirIsAddon(options.in)) {
        throw new SilentError(
          `You specified the 'in' flag, but the ` +
            `in repo addon '${options.in}' does not exist. Please check the name and try again.`
        );
      }
    }
  },

  /**
    @private
    @method _process
    @param {Object} options
    @param {Function} beforeHook
    @param {Function} process
    @param {Function} afterHook
  */
  async _process(options, beforeHook, process, afterHook) {
    let intoDir = options.target;

    let locals = await this._locals(options);

    // run beforeInstall/beforeUninstall userland hooks
    await beforeHook.call(this, options, locals);

    // gather fileInfos to be processed
    let fileInfos = await process.call(this, intoDir, locals, options);

    // commit changes for each FileInfo (with prompting as needed)
    await Promise.all(fileInfos.map((info) => this._commit(info)));

    // run afterInstall/afterUninstall userland hooks
    await afterHook.call(this, options);
  },

  /**
    @private
    @method shouldConvertToJS
    @param {Object} options
    @param {FileInfo} fileInfo
    @return {Boolean}
  */
  shouldConvertToJS(options, fileInfo) {
    // If this isn't turned on, it doesn't matter what else was passed, we're not touching it.
    if (!this.shouldTransformTypeScript) {
      return false;
    }

    // If the blueprint isn't a TS file to begin with, there's nothing to convert.
    if (!isTypeScriptFile(fileInfo.outputPath)) {
      return false;
    }

    // Indicates when the user explicitly passed either `--typescript` or `--no-typescript` as opposed
    // to not passing a flag at all and allowing for default behavior
    const userExplicitlySelectedTypeScriptStatus = options.typescript !== undefined;

    // Indicates when the user has asked for TypeScript either globally (by setting
    // `isTypeScriptProject` to true) or locally (by passing the `--typescript` flag when they
    // invoked the generator). Although ember-cli merges `.ember-cli` and all of the flag values into
    // one object, we thought the DX would be improved by differentiating between what is intended
    // to be global vs. local config.
    const shouldUseTypeScript = userExplicitlySelectedTypeScriptStatus
      ? options.typescript
      : options.isTypeScriptProject;

    // if the user wants TS output and we have a TS file available, we do *not* want to downlevel to JS
    if (shouldUseTypeScript) {
      return false;
    }

    return true;
  },

  /**
    @private
    @method convertToJS
    @param {FileInfo} fileInfo
    @return {Promise}
  */
  async convertToJS(fileInfo) {
    let rendered = await fileInfo.render();

    fileInfo.rendered = await this.removeTypes(path.extname(fileInfo.displayPath), rendered);
    fileInfo.displayPath = replaceTypeScriptExtension(fileInfo.displayPath);
    fileInfo.outputPath = replaceTypeScriptExtension(fileInfo.outputPath);

    return fileInfo;
  },

  /**
    @private
    @method removeTypes
    @param {string} extension
    @param {string} code
    @return {Promise}
  */
  async removeTypes(extension, code) {
    const { removeTypes } = require('babel-remove-types');

    if (extension === '.gts') {
      const { Preprocessor } = require('content-tag');
      const preprocessor = new Preprocessor();
      // Strip template tags
      const replacementClassMember = (i) => `template = __TEMPLATE_TAG_${i}__;`;
      const replacementExpression = (i) => `__TEMPLATE_TAG_${i}__`;
      const templateTagMatches = preprocessor.parse(code);
      let strippedCode = code;
      for (let i = 0; i < templateTagMatches.length; i++) {
        const match = templateTagMatches[i];
        const templateTag = substringBytes(code, match.range.start, match.range.end);
        if (match.type === 'class-member') {
          strippedCode = strippedCode.replace(templateTag, replacementClassMember(i));
        } else {
          strippedCode = strippedCode.replace(templateTag, replacementExpression(i));
        }
      }

      // Remove types
      const transformed = await removeTypes(strippedCode);

      // Readd stripped template tags
      let transformedWithTemplateTag = transformed;
      for (let i = 0; i < templateTagMatches.length; i++) {
        const match = templateTagMatches[i];
        const templateTag = substringBytes(code, match.range.start, match.range.end);
        if (match.type === 'class-member') {
          transformedWithTemplateTag = transformedWithTemplateTag.replace(replacementClassMember(i), templateTag);
        } else {
          // babel-remove-types uses prettier under the hood, and adds trailing `;` where allowed,
          // so we need to take that into account when restoring the template tags:
          transformedWithTemplateTag = transformedWithTemplateTag.replace(`${replacementExpression(i)};`, templateTag);
          transformedWithTemplateTag = transformedWithTemplateTag.replace(replacementExpression(i), templateTag);
        }
      }

      return transformedWithTemplateTag;
    }

    return await removeTypes(code);
  },

  /**
    @method install
    @param {Object} options
    @return {Promise}
  */
  install(options) {
    this._processOptions(options);

    this.hasPathToken = hasPathToken(this.files(this.options));

    this.ui.writeLine(`installing ${this.name}`);

    if (this.dryRun) {
      this.ui.writeLine(chalk.yellow('You specified the `dry-run` flag, so no changes will be written.'));
    }

    this._normalizeEntityName(options.entity);
    this._checkForPod(options.verbose);
    this._checkInRepoAddonExists(options);

    logger.info('START: processing blueprint: `%s`', this.name);
    let start = new Date();
    return this._process(options, this.beforeInstall, this.processFiles, this.afterInstall).finally(() =>
      logger.info('END: processing blueprint: `%s` in (%dms)', this.name, new Date() - start)
    );
  },

  /**
    @method uninstall
    @param {Object} options
    @return {Promise}
  */
  uninstall(options) {
    this._processOptions(options);

    this.hasPathToken = hasPathToken(this.files(this.options));

    this.ui.writeLine(`uninstalling ${this.name}`);

    if (this.dryRun) {
      this.ui.writeLine(chalk.yellow('You specified the `dry-run` flag, so no files will be deleted.'));
    }

    this._normalizeEntityName(options.entity);
    this._checkForPod(options.verbose);

    return this._process(options, this.beforeUninstall, this.processFilesForUninstall, this.afterUninstall);
  },

  /**
    Hook for running operations before install.
    @method beforeInstall
    @return {Promise|null}
  */
  beforeInstall() {},

  /**
    Hook for running operations after install.
    @method afterInstall
    @return {Promise|null}
  */
  afterInstall() {},

  /**
    Hook for running operations before uninstall.
    @method beforeUninstall
    @return {Promise|null}
  */
  beforeUninstall() {},

  /**
    Hook for running operations after uninstall.
    @method afterUninstall
    @return {Promise|null}
  */
  afterUninstall() {},

  filesToRemove: [],

  /**
    Hook for adding custom template variables.

    When the following is called on the command line:

    ```sh
    ember generate controller foo --type=array --dry-run isAdmin:true
    ```

    The object passed to `locals` looks like this:

    ```js
    {
      entity: {
        name: 'foo',
        options: {
          isAdmin: true
        }
      },
      dryRun: true
      type: "array"
      // more keys
    }
    ```

    This hook must return an object or a Promise which resolves to an object.
    The resolved object will be merged with the aforementioned default locals.

    @public
    @method locals
    @param {Object} options General and entity-specific options
    @return {Object|Promise|null}
  */
  locals(/* options */) {},

  /**
    Hook to add additional or override existing fileMap tokens.

    Use `fileMapTokens` to add custom fileMap tokens for use
    in the `mapFile` method. The hook must return an object in the
    following pattern:

    ```js
    {
      __token__(options){
        // logic to determine value goes here
        return 'value';
      }
    }
    ```

    It will be merged with the default `fileMapTokens`, and can be used
    to override any of the default tokens.

    Tokens are used in the files folder (see `files`), and get replaced with
    values when the `mapFile` method is called.

    @public
    @method fileMapTokens
    @return {Object|null}
  */
  fileMapTokens() {},

  /**
    @private
    @method _fileMapTokens
    @param {Object} options
    @return {Object}
  */
  _fileMapTokens(options) {
    let { project } = this;
    let standardTokens = {
      __name__(options) {
        if (options.pod && options.hasPathToken) {
          return options.blueprintName;
        }
        return options.dasherizedModuleName;
      },
      __path__(options) {
        let blueprintName = options.blueprintName;

        if (/-test/.test(blueprintName)) {
          blueprintName = options.blueprintName.slice(0, options.blueprintName.indexOf('-test'));
        }
        if (options.pod && options.hasPathToken) {
          return path.join(options.podPath, options.dasherizedModuleName);
        }
        return inflector.pluralize(blueprintName);
      },
      __root__(options) {
        if (options.inRepoAddon) {
          let addon = findAddonByName(project, options.inRepoAddon);
          let relativeAddonPath = path.relative(project.root, addon.root);
          return path.join(relativeAddonPath, 'addon');
        }
        if (options.in) {
          let relativeAddonPath = path.relative(project.root, options.in);
          return path.join(relativeAddonPath, 'addon');
        }
        if (options.inDummy) {
          return path.join('tests', 'dummy', 'app');
        }
        if (options.inAddon) {
          return 'addon';
        }
        return 'app';
      },
      __test__(options) {
        if (options.pod && options.hasPathToken) {
          return options.blueprintName;
        }
        return `${options.dasherizedModuleName}-test`;
      },
    };

    let customTokens = this.fileMapTokens(options) || options.fileMapTokens || {};
    return merge(standardTokens, customTokens);
  },

  /**
    Used to generate fileMap tokens for mapFile.

    @method generateFileMap
    @param {Object} fileMapVariables
    @return {Object}
  */
  generateFileMap(fileMapVariables) {
    let tokens = this._fileMapTokens(fileMapVariables);
    let fileMapValues = Object.values(tokens);
    let tokenValues = fileMapValues.map((token) => token(fileMapVariables));
    let tokenKeys = Object.keys(tokens);
    return zipObject(tokenKeys, tokenValues);
  },

  /**
    @method buildFileInfo
    @param {Function} destPath
    @param {Object} templateVariables
    @param {String} file
    @param {Object} options may be used when buildFileInfo is customized in a blueprint
    @return {FileInfo | null}
  */
  buildFileInfo(intoDir, templateVariables, file /*, options */) {
    let mappedPath = this.mapFile(file, templateVariables);

    return new FileInfo({
      action: 'write',
      outputBasePath: path.normalize(intoDir),
      outputPath: path.join(intoDir, mappedPath),
      displayPath: path.normalize(mappedPath),
      inputPath: this.srcPath(file),
      templateVariables,
      ui: this.ui,
    });
  },

  /**
    @method isUpdate
    @return {Boolean}
  */
  isUpdate() {
    if (this.project && this.project.isEmberCLIProject) {
      return this.project.isEmberCLIProject();
    }
  },

  /**
    @private
    @method _getFileInfos
    @param {Array} files
    @param {String} intoDir
    @param {Object} templateVariables
    @param {Object} options
    @return {Array} file infos
  */
  _getFileInfos(files, intoDir, templateVariables, options) {
    return files
      .map((file) => this.buildFileInfo.call(this, intoDir, templateVariables, file, options))
      .filter(Boolean);
  },

  /**
    Add update files to ignored files or reset them
    @private
    @method _ignoreUpdateFiles
  */
  _ignoreUpdateFiles() {
    if (this.isUpdate()) {
      Blueprint.ignoredFiles = Blueprint.ignoredFiles.concat(Blueprint.ignoredUpdateFiles);
    } else {
      Blueprint.ignoredFiles = initialIgnoredFiles;
    }
  },

  /**
    @private
    @method _getFilesForInstall
    @param {Array} targetFiles
    @return {Array} files
  */
  _getFilesForInstall(targetFiles) {
    let files = this.files(this.options);

    // if we've defined targetFiles, get file info on ones that match
    return (targetFiles && targetFiles.length > 0 && intersection(files, targetFiles)) || files;
  },

  /**
    @private
    @method _checkForNoMatch
    @param {Array} fileInfos
    @param {String} rawArgs
  */
  _checkForNoMatch(fileInfos, rawArgs) {
    if (fileInfos.filter(isFilePath).length < 1 && rawArgs) {
      this.ui.writeLine(
        chalk.yellow(`The globPattern "${rawArgs}" ` + `did not match any files, so no file updates will be made.`)
      );
    }
  },

  /**
    @method processFiles
    @param {String} intoDir
    @param {Object} templateVariables
    @param {Object} options
    @return {Promise<FileInfo[]>}
  */
  processFiles(intoDir, templateVariables, options) {
    let files = this._getFilesForInstall(templateVariables.targetFiles);
    let fileInfos = this._getFileInfos(files, intoDir, templateVariables, options);
    this._checkForNoMatch(fileInfos, templateVariables.rawArgs);

    this._ignoreUpdateFiles();

    let fileInfosToRemove = this._getFileInfos(this.filesToRemove, intoDir, templateVariables);

    fileInfosToRemove = finishProcessingForUninstall(fileInfosToRemove);

    return Promise.all(fileInfos.filter(isValidFile).map(prepareConfirm))
      .then(finishProcessingForInstall)
      .then((fileInfos) => {
        return Promise.all(
          fileInfos.map((info) => {
            if (this.shouldConvertToJS(this.options, info)) {
              return this.convertToJS(info);
            }

            return info;
          })
        );
      })
      .then((fileInfos) => fileInfos.concat(fileInfosToRemove));
  },

  /**
    @method processFilesForUninstall
    @param {String} intoDir
    @param {Object} templateVariables
  */
  processFilesForUninstall(intoDir, templateVariables) {
    let fileInfos = this._getFileInfos(this.files(this.options), intoDir, templateVariables);

    this._ignoreUpdateFiles();

    fileInfos = fileInfos.filter(isValidFile).reduce((acc, info) => {
      // if it's possible that this blueprint could have produced either typescript OR javascript, we have to do some
      // work to figure out which files to delete.
      if (this.shouldTransformTypeScript) {
        if (this.options.typescript === true) {
          // if the user explicitly passed `--typescript`, we only want to delete TS files, so we stick with the existing
          // info object since it will contain a .ts outputPath (since we know this blueprint is authored in TS because
          // of our check above)
          acc.push(info);
          return acc;
        }

        const jsInfo = new FileInfo({
          ...info,
          outputPath: replaceTypeScriptExtension(info.outputPath),
          displayPath: replaceTypeScriptExtension(info.displayPath),
        });

        if (this.options.typescript === false) {
          // if the user explicitly passed `--no-typescript`, we only want to delete JS file, so we return our newly
          // created jsInfo object since it contains the javascript version of the output path.
          acc.push(jsInfo);
          return acc;
        }

        if (this.options.typescript === undefined) {
          // if the user didn't specify one way or the other, then both the JS and TS paths are possibilities, so we add
          // both of them to the list. `finishProcessingForUninstall` will actually look to see which of them exists and
          // delete whatever it finds.
          acc.push(info, jsInfo);
          return acc;
        }
      }

      acc.push(info);
      return acc;
    }, []);

    return finishProcessingForUninstall(fileInfos);
  },

  /**
    @method mapFile
    @param {String} file
    @param locals
    @return {String}
  */
  mapFile(file, locals) {
    let pattern, i;
    let fileMap = locals.fileMap || { __name__: locals.dasherizedModuleName };
    file = Blueprint.renamedFiles[file] || file;
    for (i in fileMap) {
      pattern = new RegExp(i, 'g');
      file = file.replace(pattern, fileMap[i]);
    }
    return file;
  },

  /**
    Looks for a __root__ token in the files folder. Must be present for
    the blueprint to support addon tokens. The `server`, `blueprints`, and `test`

    @private
    @method supportsAddon
    @return {Boolean}
  */
  supportsAddon() {
    return /__root__/.test(this.files(this.options).join());
  },

  /**
    @private
    @method _generateFileMapVariables
    @param {String} moduleName
    @param locals
    @param {Object} options
    @return {Object}
  */
  _generateFileMapVariables(moduleName, locals, options) {
    let originBlueprintName = options.originBlueprintName || this.name;
    let podModulePrefix = this.project.config().podModulePrefix || '';
    let podPath = podModulePrefix.substr(podModulePrefix.lastIndexOf('/') + 1);
    let inAddon = this.project.isEmberCLIAddon() || !!options.inRepoAddon;
    let inDummy = this.project.isEmberCLIAddon() ? options.dummy : false;

    return {
      pod: this.pod,
      podPath,
      hasPathToken: this.hasPathToken,
      inAddon,
      inRepoAddon: options.inRepoAddon,
      in: options.in,
      inDummy,
      blueprintName: this.name,
      originBlueprintName,
      dasherizedModuleName: stringUtils.dasherize(moduleName),
      locals,
    };
  },

  /**
    @private
    @method _locals
    @param {Object} options
    @return {Object}
  */
  _locals(options) {
    let packageName = options.project.name();
    let moduleName = (options.entity && options.entity.name) || packageName;
    let sanitizedModuleName = moduleName.replace(/\//g, '-');

    return new Promise((resolve) => {
      resolve(this.locals(options));
    }).then((customLocals) => {
      let fileMapVariables = this._generateFileMapVariables(moduleName, customLocals, options);
      let fileMap = this.generateFileMap(fileMapVariables);
      let standardLocals = {
        dasherizedPackageName: stringUtils.dasherize(packageName),
        classifiedPackageName: stringUtils.classify(packageName),
        dasherizedModuleName: stringUtils.dasherize(moduleName),
        classifiedModuleName: stringUtils.classify(sanitizedModuleName),
        camelizedModuleName: stringUtils.camelize(sanitizedModuleName),
        decamelizedModuleName: stringUtils.decamelize(sanitizedModuleName),
        fileMap,
        hasPathToken: this.hasPathToken,
        targetFiles: options.targetFiles,
        rawArgs: options.rawArgs,
      };

      return merge({}, standardLocals, customLocals);
    });
  },

  /**
    Used to add a package to the project's `package.json`.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that a package that is required by a given blueprint is
    available.

    @method addPackageToProject
    @param {String} packageName
    @param {String} target
    @return {Promise}
  */
  addPackageToProject(packageName, target) {
    let packageObject = { name: packageName };

    if (target) {
      packageObject.target = target;
    }

    return this.addPackagesToProject([packageObject]);
  },

  /**
    Used to add multiple packages to the project's `package.json`.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that a package that is required by a given blueprint is
    available.

    Expects each array item to be an object with a `name`.  Each object
    may optionally have a `target` to specify a specific version.

    @method addPackagesToProject
    @param {Array} packages
    @return {Promise}

    @example
    ```js
    this.addPackagesToProject([
      { name: 'lodash' },
      { name: 'moment', target: '^2.17.0' },
    ]);
    ```
  */
  addPackagesToProject(packages) {
    let task = this.taskFor('npm-install');
    let installText = packages.length > 1 ? 'install packages' : 'install package';
    let packageNames = [];
    let packageArray = [];

    for (let i = 0; i < packages.length; i++) {
      packageNames.push(packages[i].name);

      let packageNameAndVersion = packages[i].name;

      if (packages[i].target) {
        packageNameAndVersion += `@${packages[i].target}`;
      }

      packageArray.push(packageNameAndVersion);
    }

    this._writeStatusToUI(chalk.green, installText, packageNames.join(', '));

    return task.run({
      'save-dev': true,
      verbose: false,
      packages: packageArray,
    });
  },

  /**
    Used to remove a package from the project's `package.json`.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that any package conflicts can be resolved before the
    addon is used.

    @method removePackageFromProject
    @param {String} packageName
    @return {Promise}
  */
  removePackageFromProject(packageName) {
    let packageObject = { name: packageName };

    return this.removePackagesFromProject([packageObject]);
  },

  /**
    Used to remove multiple packages from the project's `package.json`.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that any package conflicts can be resolved before the
    addon is used.

    Expects each array item to be an object with a `name` property.

    @method removePackagesFromProject
    @param {Array} packages
    @return {Promise}
  */
  removePackagesFromProject(packages) {
    let task = this.taskFor('npm-uninstall');
    let installText = packages.length > 1 ? 'uninstall packages' : 'uninstall package';
    let packageNames = [];

    let projectDependencies = this.project.dependencies();

    for (let i = 0; i < packages.length; i++) {
      let packageName = packages[i].name;
      if (packageName in projectDependencies) {
        packageNames.push(packageName);
      }
    }

    if (packageNames.length === 0) {
      this._writeStatusToUI(chalk.yellow, 'remove', 'Skipping uninstall because no matching package is installed.');
      return Promise.resolve();
    }

    this._writeStatusToUI(chalk.green, installText, packageNames.join(', '));

    return task.run({
      'save-dev': true,
      verbose: false,
      packages: packageNames,
    });
  },

  /**
    Used to add an addon to the project's `package.json` and run it's
    `defaultBlueprint` if it provides one.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that a package that is required by a given blueprint is
    available.

    @method addAddonToProject
    @param {Object} options
    @return {Promise}
  */
  addAddonToProject(options) {
    return this.addAddonsToProject({
      packages: [options],
      extraArgs: options.extraArgs || {},
      blueprintOptions: options.blueprintOptions || {},
    });
  },

  /**
    Used to add multiple addons to the project's `package.json` and run their
    `defaultBlueprint` if they provide one.

    Generally, this would be done from the `afterInstall` hook, to
    ensure that a package that is required by a given blueprint is
    available.

    @method addAddonsToProject
    @param {Object} options
    @return {Promise}
  */
  addAddonsToProject(options) {
    let taskOptions = {
      packages: [],
      extraArgs: options.extraArgs || [],
      blueprintOptions: options.blueprintOptions || {},
    };

    let packages = options.packages;
    if (packages && packages.length) {
      taskOptions.packages = packages.map((pkg) => {
        if (typeof pkg === 'string') {
          return pkg;
        }

        if (!pkg.name) {
          throw new SilentError('You must provide a package `name` to addAddonsToProject');
        }

        if (pkg.target) {
          pkg.name += `@${pkg.target}`;
        }

        return pkg.name;
      });
    } else {
      throw new SilentError('You must provide package to addAddonsToProject');
    }

    let installText = packages.length > 1 ? 'install addons' : 'install addon';
    this._writeStatusToUI(chalk.green, installText, taskOptions['packages'].join(', '));

    let previousCwd;
    if (!this.project.isEmberCLIProject()) {
      // The install task adds dependencies based on the current working directory.
      // But in case we created the new project by calling the blueprint with a custom target directory (options.target),
      // the current directory will *not* be the one the project is created in, so we must adjust this here.
      previousCwd = process.cwd();
      process.chdir(options.blueprintOptions.target);
    }

    let result = this.taskFor('addon-install').run(taskOptions);
    if (previousCwd) {
      return result.then(() => process.chdir(previousCwd));
    }

    return result;
  },

  /**
    Used to retrieve a task with the given name. Passes the new task
    the standard information available (like `ui`, `project`, etc).

    @method taskFor
    @param dasherizedName
    @public
  */
  taskFor(dasherizedName) {
    const Task = require(`../tasks/${dasherizedName}`);

    return new Task({
      ui: this.ui,
      project: this.project,
    });
  },

  /**
    Inserts the given content into a file. If the `contentsToInsert` string is already
    present in the current contents, the file will not be changed unless `force` option
    is passed.

    If `options.before` is specified, `contentsToInsert` will be inserted before
    the first instance of that string.  If `options.after` is specified, the
    contents will be inserted after the first instance of that string.
    If the string specified by options.before or options.after is not in the file,
    no change will be made.

    If neither `options.before` nor `options.after` are present, `contentsToInsert`
    will be inserted at the end of the file.

    Example:
    ```
    // app/router.js
    Router.map(function () {
    });
    ```

    ```
    insertIntoFile('app/router.js', '  this.route("admin");', {
      after: 'Router.map(function () {' + EOL
    }).then(function() {
      // file has been inserted into!
    });


    ```

    ```
    // app/router.js
    Router.map(function () {
      this.route("admin");
    });
    ```

    @method insertIntoFile
    @param {String} pathRelativeToProjectRoot
    @param {String} contentsToInsert
    @param {Object} providedOptions
    @return {Promise}
  */
  insertIntoFile(pathRelativeToProjectRoot, contentsToInsert, providedOptions) {
    let fullPath = path.join(this.project.root, pathRelativeToProjectRoot);
    return insertIntoFile(fullPath, contentsToInsert, providedOptions);
  },

  _printCommand: printCommand,

  printBasicHelp(verbose) {
    let initialMargin = '      ';
    let output = initialMargin;
    if (this.overridden) {
      output += chalk.grey(`(overridden) ${this.name}`);
    } else {
      output += this.name;

      output += this._printCommand(initialMargin, true);

      if (verbose) {
        output += EOL + this.printDetailedHelp(this.availableOptions);
      }
    }

    return output;
  },

  printDetailedHelp() {
    let markdownColor = new MarkdownColor();
    let filePath = getDetailedHelpPath(this.path);

    if (Blueprint._existsSync(filePath)) {
      return markdownColor.renderFile(filePath, { indent: '        ' });
    }
    return '';
  },

  getJson(verbose) {
    let json = {};
    this._printableProperties.forEach((key) => {
      let value = this[key];
      if (key === 'availableOptions') {
        value = cloneDeep(value);
        value.forEach((option) => {
          if (typeof option.type === 'function') {
            option.type = option.type.name;
          }
        });
      }
      json[key] = value;
    });

    if (verbose) {
      let detailedHelp = this.printDetailedHelp(this.availableOptions);
      if (detailedHelp) {
        json.detailedHelp = detailedHelp;
      }
    }

    return json;
  },

  /**
    Used to retrieve a blueprint with the given name.

    @method lookupBlueprint
    @param {String} dasherizedName
    @return {Blueprint}
    @public
  */
  lookupBlueprint(dasherizedName) {
    let projectPaths = this.project ? this.project.blueprintLookupPaths() : [];

    return Blueprint.lookup(dasherizedName, {
      paths: projectPaths,
    });
  },
});

const builtInBlueprints = new Map([
  ['app', '@ember-tooling/classic-build-app-blueprint'],
  ['addon', '@ember-tooling/classic-build-addon-blueprint'],
  ['blueprint', '@ember-tooling/blueprint-blueprint'],
]);

/**
  @static
  @method lookup
  @namespace Blueprint
  @param {String} name
  @param {Object} [options]
  @param {Array} [options.paths] Extra paths to search for blueprints
  @param {Boolean} [options.ignoreMissing] Throw a `SilentError` if a
    matching Blueprint could not be found
  @param {Object} [options.blueprintOptions] Options object that will be passed
    along to the Blueprint instance on creation.
  @return {Blueprint}
*/
Blueprint.lookup = function (name, options) {
  options = options || {};

  let lookupPaths = generateLookupPaths(options.paths);

  let lookupPath;
  for (let i = 0; (lookupPath = lookupPaths[i]); i++) {
    let blueprintPath = path.resolve(lookupPath, name);

    if (Blueprint._existsSync(blueprintPath)) {
      return Blueprint.load(blueprintPath, options.blueprintOptions);
    }
  }

  // Check if `name` itself is a path to a blueprint:
  if (name.includes(path.sep)) {
    let blueprintPath = path.resolve(name);

    if (Blueprint._existsSync(blueprintPath)) {
      return Blueprint.load(blueprintPath, options.blueprintOptions);
    }
  }

  // Check for the built in blueprints
  if (builtInBlueprints.has(name)) {
    let blueprintPath = require.resolve(builtInBlueprints.get(name));

    if (Blueprint._existsSync(blueprintPath)) {
      return Blueprint.load(path.dirname(blueprintPath), options.blueprintOptions);
    }
  }

  if (!options.ignoreMissing) {
    throw new SilentError(`Unknown blueprint: ${name}`);
  }
};

/**
  Loads a blueprint from given path.
  @static
  @method load
  @namespace Blueprint
  @param {String} blueprintPath
  @param {Object} [blueprintOptions]
  @return {Blueprint} blueprint instance
*/
Blueprint.load = function (blueprintPath, blueprintOptions) {
  if (fs.lstatSync(blueprintPath).isDirectory()) {
    let Constructor = Blueprint;

    let constructorPath = path.resolve(blueprintPath, 'index.js');
    if (Blueprint._existsSync(constructorPath)) {
      const blueprintModule = require(constructorPath);

      if (typeof blueprintModule === 'function') {
        Constructor = blueprintModule;
      } else {
        Constructor = Blueprint.extend(blueprintModule);
      }
    }

    return new Constructor(blueprintPath, blueprintOptions);
  }
};

/**
  @static
  @method list
  @namespace Blueprint
  @param {Object} [options]
  @param {Array} [options.paths] Extra paths to search for blueprints
  @return {Array}
*/
Blueprint.list = function (options) {
  options = options || {};

  let lookupPaths = generateLookupPaths(options.paths);
  let seen = [];

  return lookupPaths.map((lookupPath) => {
    let source;
    let packagePath = path.join(lookupPath, '../package.json');
    if (Blueprint._existsSync(packagePath)) {
      source = require(packagePath).name;
    } else {
      source = path.basename(path.join(lookupPath, '..'));
    }

    let blueprints = dir(lookupPath).map((blueprintPath) => {
      let blueprint = Blueprint.load(blueprintPath);
      if (blueprint) {
        let name = blueprint.name;
        blueprint.overridden = seen.includes(name);
        seen.push(name);

        return blueprint;
      }
    });

    // if we're listing blueprints from ember-cli then we should add the built-in blueprints
    if (source === 'ember-cli') {
      for (let [blueprintName, blueprintPackage] of builtInBlueprints.entries()) {
        let blueprint = Blueprint.load(path.dirname(require.resolve(blueprintPackage)), {
          name: blueprintName,
        });

        let name = blueprintName;
        blueprint.overridden = seen.includes(name);
        seen.push(name);

        blueprints.push(blueprint);
      }
    }

    return {
      source,
      blueprints: sortBy(compact(blueprints), 'name'),
    };
  });
};

Blueprint._existsSync = function (path, parent) {
  return fs.existsSync(path, parent);
};

Blueprint._readdirSync = function (path) {
  return fs.readdirSync(path);
};

/**
  Files that are renamed when installed into the target directory.
  This allows including files in the blueprint that would have an effect
  on another process, such as a file named `.gitignore`.

  The keys are the filenames used in the files folder.
  The values are the filenames used in the target directory.

  @static
  @property renamedFiles
*/
Blueprint.renamedFiles = {
  gitignore: '.gitignore',
};

/**
  @static
  @property ignoredFiles
*/
Blueprint.ignoredFiles = initialIgnoredFiles;

/**
  @static
  @property ignoredUpdateFiles
*/
Blueprint.ignoredUpdateFiles = ['.gitkeep', 'app.css', 'LICENSE.md'];

/**
  @static
  @property defaultLookupPaths
*/
Blueprint.defaultLookupPaths = function () {
  return [path.resolve(__dirname, '..', '..', 'blueprints')];
};

/**
  @private
  @method prepareConfirm
  @param {FileInfo} info
  @return {Promise}
*/
function prepareConfirm(info) {
  return info.checkForConflict().then((resolution) => {
    info.resolution = resolution;
    return info;
  });
}

/**
  @private
  @method markIdenticalToBeSkipped
  @param {FileInfo} info
*/
function markIdenticalToBeSkipped(info) {
  if (info.resolution === 'identical') {
    info.action = 'skip';
  }
}

/**
  @private
  @method markToBeRemoved
  @param {FileInfo} info
*/
function markToBeRemoved(info) {
  info.action = 'remove';
}

/**
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

/**
  @private
  @method isIgnored
  @param {FileInfo} info
  @return {Boolean}
*/
function isIgnored(info) {
  let fn = info.inputPath;

  return Blueprint.ignoredFiles.some((ignoredFile) => minimatch(fn, ignoredFile, { matchBase: true }));
}

/**
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

/**
  Looks for a __path__ token in the files folder. Must be present for
  the blueprint to support pod tokens.

  @private
  @method hasPathToken
  @param {files} files
  @return {Boolean}
*/
function hasPathToken(files) {
  return /__path__/.test(files.join());
}

function findAddonByName(addonOrProject, name) {
  let addon = addonOrProject.addons.find((addon) => addon.name === name);

  if (addon) {
    return addon;
  }

  return addonOrProject.addons.find((addon) => findAddonByName(addon, name));
}

function ensureTargetDirIsAddon(addonPath) {
  let projectInfo;

  try {
    projectInfo = require(path.join(addonPath, 'package.json'));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`The directory ${addonPath} does not appear to be a valid addon directory.`);
    } else {
      throw err;
    }
  }

  return isAddon(projectInfo.keywords);
}

/**
  @private
  @method isValidFile
  @param {Object} fileInfo
  @return {Promise}
*/
function isValidFile(fileInfo) {
  if (isIgnored(fileInfo)) {
    return false;
  } else {
    return isFilePath(fileInfo);
  }
}

/**
  @private
  @method isFilePath
  @param {Object} fileInfo
  @return {Promise}
*/
function isFilePath(fileInfo) {
  return fs.statSync(fileInfo.inputPath).isFile();
}

/**
 @private
 @method dir
 @return {Array} list of files in the given directory or and empty array if no directory exists
*/
function dir(fullPath) {
  if (Blueprint._existsSync(fullPath)) {
    return Blueprint._readdirSync(fullPath).map((fileName) => path.join(fullPath, fileName));
  } else {
    return [];
  }
}

/**
  @private
  @method getDetailedHelpPath
  @param {String} thisPath
  @return {String} help path
*/
function getDetailedHelpPath(thisPath) {
  return path.join(thisPath, './HELP.md');
}

function finishProcessingForInstall(infos) {
  infos.forEach(markIdenticalToBeSkipped);

  let infosNeedingConfirmation = infos.reduce(gatherConfirmationMessages, []);

  return sequence(infosNeedingConfirmation).then(() => infos);
}

function finishProcessingForUninstall(infos) {
  let validInfos = infos.filter((info) => fs.existsSync(info.outputPath));
  validInfos.forEach(markToBeRemoved);

  return validInfos;
}

function replaceExtension(filePath, newExt) {
  const { dir, name } = path.parse(filePath);

  return path.format({
    dir,
    name,
    ext: newExt,
  });
}

function replaceTypeScriptExtension(filePath) {
  const extensionMap = {
    '.ts': '.js',
    '.gts': '.gjs',
  };
  const ext = path.extname(filePath);
  const newExt = extensionMap[ext];

  return replaceExtension(filePath, newExt);
}

function isTypeScriptFile(filePath) {
  return path.extname(filePath) === '.ts' || path.extname(filePath) === '.gts';
}

/**
 * Takes a substring of a string based on byte offsets.
 * @private
 * @method substringBytes
 * @param {string} value : The input string.
 * @param {number} start : The byte index of the substring start.
 * @param {number} end : The byte index of the substring end.
 * @return {string} : The substring.
 */
function substringBytes(value, start, end) {
  let buf = Buffer.from(value);
  return buf.subarray(start, end).toString();
}

module.exports = Blueprint;
