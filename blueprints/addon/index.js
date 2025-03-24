'use strict';

const fs = require('fs-extra');
const path = require('path');
const walkSync = require('walk-sync');
const chalk = require('chalk');
const stringUtil = require('ember-cli-string-utils');
const merge = require('lodash/merge');
const uniq = require('lodash/uniq');
const SilentError = require('silent-error');
const { sortPackageJson } = require('sort-package-json');

let date = new Date();

const normalizeEntityName = require('ember-cli-normalize-entity-name');
const stringifyAndNormalize = require('../../lib/utilities/stringify-and-normalize');
const directoryForPackageName = require('../../lib/utilities/directory-for-package-name');
const FileInfo = require('../../lib/models/file-info');

const replacers = {
  'package.json'(content) {
    return this.updatePackageJson(content);
  },
};

const ADDITIONAL_PACKAGE = require('./additional-package.json');

const description = 'The default blueprint for ember-cli addons.';
module.exports = {
  description,
  appBlueprintName: 'app',

  shouldTransformTypeScript: true,

  filesToRemove: [
    'tests/dummy/app/styles/.gitkeep',
    'tests/dummy/app/templates/.gitkeep',
    'tests/dummy/app/views/.gitkeep',
    'tests/dummy/public/.gitkeep',
    'Brocfile.js',
    'testem.json',
  ],

  updatePackageJson(content) {
    let contents = JSON.parse(content);

    contents.name = stringUtil.dasherize(this.options.entity.name);
    contents.description = this.description;

    delete contents.private;

    contents.dependencies = contents.dependencies || {};
    contents.devDependencies = contents.devDependencies || {};

    // npm doesn't like it when we have something in both deps and devDeps
    // and dummy app still uses it when in deps
    contents.dependencies['ember-cli-babel'] = contents.devDependencies['ember-cli-babel'];
    delete contents.devDependencies['ember-cli-babel'];

    // Addons must bring in their own version of `@babel/core` when using
    // `ember-cli-babel` >= v8. More info:
    // https://github.com/babel/ember-cli-babel/blob/master/UPGRADING.md#upgrade-path-for-addons
    contents.dependencies['@babel/core'] = contents.devDependencies['@babel/core'];
    delete contents.devDependencies['@babel/core'];

    // Move ember-cli-htmlbars into the dependencies of the addon blueprint by default
    // to prevent error:
    // `Addon templates were detected but there are no template compilers registered for (addon-name)`
    contents.dependencies['ember-cli-htmlbars'] = contents.devDependencies['ember-cli-htmlbars'];
    delete contents.devDependencies['ember-cli-htmlbars'];

    contents.dependencies['ember-template-imports'] = contents.devDependencies['ember-template-imports'];
    delete contents.devDependencies['ember-template-imports'];

    // 95% of addons don't need ember-data or ember-fetch, make them opt-in instead
    let deps = Object.keys(contents.devDependencies);
    for (let depName of deps) {
      if (depName.includes('ember-data') || depName.includes('warp-drive')) {
        delete contents.devDependencies[depName];
      }
    }
    delete contents.devDependencies['ember-fetch'];

    // Per RFC #811, addons should not have this dependency.
    // @see https://github.com/emberjs/rfcs/blob/master/text/0811-element-modifiers.md#detailed-design
    delete contents.devDependencies['ember-modifier'];

    // Per RFC #812, addons should not have this dependency.
    // @see https://github.com/emberjs/rfcs/blob/master/text/0812-tracked-built-ins.md#detailed-design
    delete contents.devDependencies['tracked-built-ins'];

    // 100% of addons don't need ember-cli-app-version, make it opt-in instead
    delete contents.devDependencies['ember-cli-app-version'];

    // add scripts to build type declarations for TypeScript addons
    if (this.options.typescript) {
      contents.devDependencies.rimraf = '^5.0.1';

      contents.scripts.prepack = 'tsc --project tsconfig.declarations.json';
      contents.scripts.postpack = 'rimraf declarations';

      contents.typesVersions = {
        '*': {
          'test-support': ['declarations/addon-test-support/index.d.ts'],
          'test-support/*': ['declarations/addon-test-support/*', 'declarations/addon-test-support/*/index.d.ts'],
          '*': ['declarations/addon/*', 'declarations/addon/*/index.d.ts'],
        },
      };
    }

    merge(contents, ADDITIONAL_PACKAGE);

    return stringifyAndNormalize(sortPackageJson(contents));
  },

  /**
   * @override
   *
   * This modification of buildFileInfo allows our differing
   * input files to output to a single file, depending on the options.
   * For example:
   *
   *   for javascript,
   *     _ts_eslint.config.mjs is deleted
   *     _js_eslint.config.mjs is renamed to eslint.config.mjs
   *
   *   for typescript,
   *     _js_eslint.config.mjs is deleted
   *     _ts_eslint.config.mjs is renamed to eslint.config.mjs
   */
  buildFileInfo(intoDir, templateVariables, file, commandOptions) {
    if (file.startsWith('_js_') || file.startsWith('_ts_')) {
      let fileInfo = this._super.buildFileInfo.apply(this, arguments);

      if (file.includes('_js_')) {
        if (commandOptions.typescript) {
          return null;
        }

        fileInfo.outputBasePath = fileInfo.outputPath.replace('_js_', '');
        fileInfo.outputPath = fileInfo.outputPath.replace('_js_', '');
        fileInfo.displayPath = fileInfo.outputPath.replace('_js_', '');
        return fileInfo;
      }

      if (file.includes('_ts_')) {
        if (!commandOptions.typescript) {
          return null;
        }

        fileInfo.outputBasePath = fileInfo.outputPath.replace('_ts_', '');
        fileInfo.outputPath = fileInfo.outputPath.replace('_ts_', '');
        fileInfo.displayPath = fileInfo.outputPath.replace('_ts_', '');
        return fileInfo;
      }

      return fileInfo;
    }

    let mappedPath = this.mapFile(file, templateVariables);
    let options = {
      action: 'write',
      outputBasePath: path.normalize(intoDir),
      outputPath: path.join(intoDir, mappedPath),
      displayPath: path.normalize(mappedPath),
      inputPath: this.srcPath(file),
      templateVariables,
      ui: this.ui,
    };

    if (file in replacers) {
      options.replacer = replacers[file].bind(this);
    }

    return new FileInfo(options);
  },

  beforeInstall() {
    const version = require('../../package.json').version;
    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    this.ui.writeLine(chalk.blue(`Ember CLI v${version}`));
    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('✨', `Creating a new Ember addon in ${chalk.yellow(process.cwd())}:`));
  },

  locals(options) {
    let entity = { name: 'dummy' };
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);
    let namespace = stringUtil.classify(rawName);

    let addonEntity = options.entity;
    let addonRawName = addonEntity.name;
    let addonName = stringUtil.dasherize(addonRawName);
    let addonNamespace = stringUtil.classify(addonRawName);

    let hasOptions = options.welcome || options.packageManager || options.ciProvider;
    let blueprintOptions = '';
    if (hasOptions) {
      let indent = `\n            `;
      let outdent = `\n          `;

      blueprintOptions =
        indent +
        [
          options.welcome && '"--welcome"',
          options.packageManager === 'yarn' && '"--yarn"',
          options.packageManager === 'pnpm' && '"--pnpm"',
          options.ciProvider && `"--ci-provider=${options.ciProvider}"`,
          options.typescript && `"--typescript"`,
        ]
          .filter(Boolean)
          .join(',\n            ') +
        outdent;
    }

    let invokeScriptPrefix = 'npm run';

    if (options.packageManager === 'yarn') {
      invokeScriptPrefix = 'yarn';
    }

    if (options.packageManager === 'pnpm') {
      invokeScriptPrefix = 'pnpm';
    }

    return {
      addonDirectory: directoryForPackageName(addonName),
      name,
      modulePrefix: name,
      namespace,
      addonName,
      addonNamespace,
      emberCLIVersion: require('../../package').version,
      year: date.getFullYear(),
      yarn: options.packageManager === 'yarn',
      pnpm: options.packageManager === 'pnpm',
      npm: options.packageManager !== 'yarn' && options.packageManager !== 'pnpm',
      invokeScriptPrefix,
      welcome: options.welcome,
      blueprint: 'addon',
      blueprintOptions,
      embroider: false,
      lang: options.lang,
      emberData: options.emberData,
      ciProvider: options.ciProvider,
      typescript: options.typescript,
      packageManager: options.packageManager ?? 'npm',
    };
  },

  files(options) {
    let appFiles = this.lookupBlueprint(this.appBlueprintName).files(options);
    let addonFilesPath = this.filesPath(this.options);
    let ignore = [];

    if (this.options.ciProvider !== 'github') {
      ignore.push('.github');
    }

    let addonFiles = walkSync(addonFilesPath, { ignore });

    if (options.packageManager !== 'pnpm') {
      addonFiles = addonFiles.filter((file) => !file.endsWith('.npmrc'));
    }

    if (!options.typescript) {
      addonFiles = addonFiles.filter((file) => !file.startsWith('tsconfig.') && !file.endsWith('.d.ts'));
    }

    return uniq(appFiles.concat(addonFiles));
  },

  mapFile() {
    let result = this._super.mapFile.apply(this, arguments);
    return this.fileMapper(result);
  },

  fileMap: {
    '^app/.gitkeep': 'app/.gitkeep',
    '^app.*': 'tests/dummy/:path',
    '^config.*': 'tests/dummy/:path',
    '^public.*': 'tests/dummy/:path',

    '^addon-config/ember-try.js': 'tests/dummy/config/ember-try.js',

    '^npmignore': '.npmignore',
  },

  fileMapper(path) {
    for (let pattern in this.fileMap) {
      if (new RegExp(pattern).test(path)) {
        return this.fileMap[pattern].replace(':path', path);
      }
    }

    return path;
  },

  normalizeEntityName(entityName) {
    entityName = normalizeEntityName(entityName);

    if (this.project.isEmberCLIProject() && !this.project.isEmberCLIAddon()) {
      throw new SilentError('Generating an addon in an existing ember-cli project is not supported.');
    }

    return entityName;
  },

  srcPath(file) {
    let path = `${this.path}/files/${file}`;
    let superPath = `${this.lookupBlueprint(this.appBlueprintName).path}/files/${file}`;
    return fs.existsSync(path) ? path : superPath;
  },
};
