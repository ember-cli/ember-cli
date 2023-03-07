'use strict';

const path = require('path');

const TS_FILES = ['tsconfig.json', 'types', 'app/config/environment.d.ts'];

const APP_DECLARATIONS = `import Ember from 'ember';

declare global {
  // Prevents ESLint from "fixing" this via its auto-fix to turn it into a type
  // alias (e.g. after running any Ember CLI generator)
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends Ember.ArrayPrototypeExtensions<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}
}

export {};`;

/**
  * Abstraction around a Blueprint so that all of the TypeScript related
  * code can be co-located, and not mixed in with the main blueprint.
  */
class TypeScriptSupport {
  constructor(blueprintInstance) {
    this._blueprintInstance = blueprintInstance;
  }

  get isEnabled() {
    return this._blueprintInstance.options.typescript;
  }

  get project() {
    return this._blueprintInstance.project;
  }

  /**
    * @param {string[]} files
    */
  filterFiles = (files) => {
    let result = files;

    if (!this.isEnabled) {
      /**
        * TypeScript is disabled, filter out all files
        */
      result = files.filter((file) => !isTSFile(file));
    } else if (!this.has('ember-data')) {
      /**
        * TypeScript is enabled, but ember-data is not installed
        */
      result = result.filter((file) => file !== 'types/ember-data/types/registries/model.d.ts');
    }

    return result
  };

  /**
    * @param {string} packageName
    */
   has = (packageName) => {
    if (!this.project) {
      return packageName in this.project.dependencies();
    }
  };

  additionalLocals = (options) => {
    if (!this.isEnabled) return {};

    let inRepoAddons = (this.project.pkg['ember-addon'] || {}).paths || [];
    let hasMirage = 'ember-cli-mirage' in (this.project.pkg.devDependencies || {});
    let isAddon = this.project.isEmberCLIAddon();
    let includes = ['app', isAddon && 'addon'].filter(Boolean);
    const isPods = this.pod;

    includes = includes.concat(['tests', 'types']).concat(inRepoAddons);

    if (isAddon) {
      includes.push('test-support', 'addon-test-support');
    }

    // Mirage is already covered for addons because it's under `tests/`
    if (hasMirage && !isAddon) {
      includes.push('mirage');
    }

    return {
      includes: JSON.stringify(
        includes.map((include) => `${include}/**/*`),
        null,
        2
      ).replace(/\n/g, '\n  '),
      pathsFor: (dasherizedName) => {
        let appName = isAddon ? 'dummy' : dasherizedName;
        let paths = {
          [`${appName}/tests/*`]: ['tests/*'],
        };

        if (hasMirage) {
          paths[`${appName}/mirage/*`] = [`${isAddon ? 'tests/dummy/' : ''}mirage/*`];
        }

        if (isAddon) {
          paths[`${appName}/*`] = ['tests/dummy/app/*', 'app/*'];
        } else {
          paths[`${appName}/*`] = ['app/*'];
        }

        if (isAddon) {
          paths[dasherizedName] = ['addon'];
          paths[`${dasherizedName}/*`] = ['addon/*'];
          paths[`${dasherizedName}/test-support`] = ['addon-test-support'];
          paths[`${dasherizedName}/test-support/*`] = ['addon-test-support/*'];
        }

        for (let addon of inRepoAddons) {
          updatePathsForAddon(paths, path.basename(addon), appName);
        }

        paths['*'] = ['types/*'];

        return JSON.stringify(paths, null, 2).replace(/\n/g, '\n    ');
      },
      indexDeclarations: (dasherizedName) => {
        const isDummyApp = dasherizedName === 'dummy';
        const useAppDeclarations = !(isAddon || isDummyApp);
        return useAppDeclarations ? APP_DECLARATIONS : '';
      },
      globalDeclarations: (dasherizedName) => {
        /** @type {'classic' | 'pods'} */
        let projectLayout;
        if (isPods) projectLayout = 'pods';
        else projectLayout = 'classic';
        return buildTemplateDeclarations(dasherizedName, projectLayout);
      },
    };
  }

  addPackages = () => {
    if (!this.isEnabled) return;

    // TODO: is addon, transformAddonPackage

    // TODO: use built in types instead of the DT types?
    let packages = [
      'typescript',
      '@tsconfig/ember',
      '@types/ember',
      '@types/ember-resolver',
      '@types/ember__object',
      '@types/ember__service',
      '@types/ember__controller',
      '@types/ember__destroyable',
      '@types/ember__string',
      '@types/ember__template',
      '@types/ember__polyfills',
      '@types/ember__utils',
      '@types/ember__runloop',
      '@types/ember__debug',
      '@types/ember__engine',
      '@types/ember__application',
      '@types/ember__test',
      '@types/ember__array',
      '@types/ember__error',
      '@types/ember__component',
      '@types/ember__routing',
      '@types/rsvp',
    ];

    if (this.has('@ember/jquery')) {
      packages.push('@types/jquery');
    }

    if (this.has('ember-data')) {
      packages.push('@types/ember-data');
      packages.push('@types/ember-data__adapter');
      packages.push('@types/ember-data__model');
      packages.push('@types/ember-data__serializer');
      packages.push('@types/ember-data__store');
    }

    if (this.has('ember-cli-qunit') || this.has('ember-qunit')) {
      packages.push('@types/ember-qunit');
      packages.push('@types/qunit');
    }

    if (this.has('ember-cli-mocha') || this.has('ember-mocha')) {
      packages.push('@types/ember-mocha');
      packages.push('@types/mocha');
    }

    return this._blueprintInstance.addPackagesToProject(
      packages.map((name) => {
        return { name, target: 'latest' };
      })
    );
  }
}

/**
  * @param {string} file
  */
function isTSFile(file) {
  return TS_FILES.some((tsFile) => file.indexOf(tsFile) < 0);
}

/* eslint-disable no-prototype-builtins */

function updatePathsForAddon(paths, addonName, appName, options) {
  options = options || {};
  const addonNameStar = [addonName, '*'].join('/');
  const addonPath = [options.isLinked ? 'node_modules' : 'lib', addonName].join('/');
  const addonAddonPath = [addonPath, 'addon'].join('/');
  const addonAppPath = [addonPath, 'app'].join('/');
  const appNameStar = [appName, '*'].join('/');
  const addonTestSupportPath = [addonName, 'test-support'].join('/');
  const addonTestSupportStarPath = `${addonTestSupportPath}/*`;
  let appStarPaths;
  paths = paths || {};
  appStarPaths = paths[appNameStar] = paths[appNameStar] || [];

  if (options.removePaths) {
    if (paths.hasOwnProperty(addonName)) {
      delete paths[addonName];
    }
    if (paths.hasOwnProperty(addonNameStar)) {
      delete paths[addonNameStar];
    }
    let addonAppPathIndex = appStarPaths.indexOf([addonAppPath, '*'].join('/'));
    if (addonAppPathIndex > -1) {
      appStarPaths.splice(addonAppPathIndex, 1);
      paths[appNameStar] = appStarPaths;
    }
  } else {
    if (!paths.hasOwnProperty(addonName)) {
      paths[addonName] = [addonAddonPath];
    }
    if (!paths.hasOwnProperty(addonNameStar)) {
      paths[addonNameStar] = [[addonAddonPath, '*'].join('/')];
    }
    if (!paths.hasOwnProperty(addonTestSupportPath)) {
      paths[addonTestSupportPath] = [[addonPath, 'addon-test-support'].join('/')];
    }
    if (!paths.hasOwnProperty(addonTestSupportStarPath)) {
      paths[addonTestSupportStarPath] = [[addonPath, 'addon-test-support', '*'].join('/')];
    }
    if (appStarPaths.indexOf(addonAppPath) === -1) {
      appStarPaths.push([addonAppPath, '*'].join('/'));
      paths[appNameStar] = appStarPaths;
    }
  }
};

/**
 * @param {string} projectName
 * @param {'classic' | 'pods'} layout
 */
function buildTemplateDeclarations(projectName, layout) {
  const comment = '// Types for compiled templates';
  const moduleBody = `
  import { TemplateFactory } from 'ember-cli-htmlbars';

  const tmpl: TemplateFactory;
  export default tmpl;
`;
  switch (layout) {
    case 'classic':
      return `${comment}
declare module '${projectName}/templates/*' {${moduleBody}}`;
    case 'pods':
      return `${comment}
declare module '${projectName}/*/template' {${moduleBody}}`;
    default:
      throw new Error(`Unexpected project layout type: "${layout}"`);
  }
}


module.exports = {
  TypeScriptSupport,
}
