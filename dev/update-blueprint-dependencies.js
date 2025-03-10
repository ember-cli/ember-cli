'use strict';

function usage() {
  console.log(`This script updates the dependencies / devDependencies in the main addon and app blueprints along with their corresponding test fixtures.

Options:

  - '--ember-source' (required) - The dist-tag to use for ember-source
  - '--ember-data' (required) - The dist-tag to use for ember-data
  - '--filter' (optional) - A RegExp to filter the packages to update by
  - '--latest' (optional) - Always use the latest version available for a package (includes major bumps, 'false' by default)

Example:

node dev/update-blueprint-dependencies.js --ember-source=beta --ember-data=beta

node dev/update-blueprint-dependencies.js --filter /eslint/

node dev/update-blueprint-dependencies.js --filter some-package@beta
`);
}

const fs = require('fs');
const path = require('path');
const util = require('util');
const nopt = require('nopt');
const npmPackageArg = require('npm-package-arg');
const _latestVersion = require('latest-version');

nopt.typeDefs['regexp'] = {
  type: RegExp,
  validate(data, key, value) {
    let regexp = new RegExp(value);

    data[key] = regexp;
  },
};

const OPTIONS = nopt({
  'ember-source': String,
  'ember-data': String,
  filter: String,
  latest: Boolean,
});

const PACKAGE_FILES = [
  '../blueprints/app/files/package.json',
  '../blueprints/addon/additional-package.json',
  '../tests/fixtures/app/defaults/package.json',
  '../tests/fixtures/app/npm/package.json',
  '../tests/fixtures/app/yarn/package.json',
  '../tests/fixtures/app/pnpm/package.json',
  '../tests/fixtures/app/embroider/package.json',
  '../tests/fixtures/app/embroider-yarn/package.json',
  '../tests/fixtures/app/embroider-pnpm/package.json',
  '../tests/fixtures/app/embroider-no-welcome/package.json',
  '../tests/fixtures/app/typescript/package.json',
  '../tests/fixtures/app/typescript-embroider/package.json',
  '../tests/fixtures/addon/defaults/package.json',
  '../tests/fixtures/addon/yarn/package.json',
  '../tests/fixtures/addon/pnpm/package.json',
  '../tests/fixtures/addon/typescript/package.json',
];

let filter = {
  nameRegexp: null,
  name: null,
};

if (OPTIONS.filter) {
  if (OPTIONS.filter.startsWith('/')) {
    filter.nameRegexp = new RegExp(OPTIONS.filter.substring(1, OPTIONS.filter.length - 1));
    // can only use latest when using a regexp style
    filter.fetchSpec = 'latest';
  } else {
    let packageArgResult = npmPackageArg(OPTIONS.filter);
    filter.name = packageArgResult.name;
    OPTIONS[packageArgResult.name] = filter.fetchSpec = packageArgResult.fetchSpec;
  }
}

function shouldCheckDependency(dependency) {
  if (filter.nameRegexp) {
    return filter.nameRegexp.test(dependency);
  }

  if (filter.name) {
    return dependency === filter.name;
  }

  return true;
}

const LATEST = new Map();
async function latestVersion(packageName, semverRange) {
  let result = LATEST.get(packageName);

  if (result === undefined) {
    let options = {
      version: semverRange,
    };

    if (isEmberDataPackage(packageName) && OPTIONS['ember-data']) {
      options.version = OPTIONS['ember-data'];
    }

    if (OPTIONS[packageName]) {
      options.version = OPTIONS[packageName];
    }

    result = _latestVersion(packageName, options);
    LATEST.set(packageName, result);
  }

  return result;
}

async function updateDependencies(dependencies) {
  for (let dependencyKey in dependencies) {
    let dependencyName = removeTemplateExpression(dependencyKey);

    if (!shouldCheckDependency(dependencyName)) {
      continue;
    }

    let previousValue = dependencies[dependencyKey];

    // grab the first char (~ or ^)
    let prefix = previousValue[0];
    let isValidPrefix = prefix === '~' || prefix === '^';

    // handle things from blueprints/app/files/package.json like `^2.4.0<% if (welcome) { %>`
    let templateSuffix = previousValue.includes('<') ? previousValue.slice(previousValue.indexOf('<')) : '';

    // check if we are dealing with `~<%= emberCLIVersion %>`
    let hasVersion = previousValue[1] !== '<';

    if (hasVersion && isValidPrefix) {
      const semverRange = OPTIONS.latest ? 'latest' : removeTemplateExpression(previousValue);
      const newVersion = await latestVersion(dependencyName, semverRange);

      dependencies[dependencyKey] = `${prefix}${newVersion}${templateSuffix}`;
    }
  }
}

function removeTemplateExpression(dependency) {
  if (dependency.includes('<') === false) {
    return dependency;
  }

  let semverRange = dependency.replace(
    dependency.substring(dependency.indexOf('<'), dependency.lastIndexOf('>') + 1),
    ''
  );

  return semverRange;
}

async function main() {
  for (let packageFile of PACKAGE_FILES) {
    let filePath = path.join(__dirname, packageFile);
    let pkg = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));

    await updateDependencies(pkg.dependencies);
    await updateDependencies(pkg.devDependencies);

    let output = `${JSON.stringify(pkg, null, 2)}\n`;

    fs.writeFileSync(filePath, output, { encoding: 'utf8' });
  }
}

if (module === require.main) {
  // ensure promise rejection is a failure
  process.on('unhandledRejection', (error) => {
    if (!(error instanceof Error)) {
      error = new Error(`Promise rejected with value: ${util.inspect(error)}`);
    }

    console.error(error.stack);

    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });

  if (OPTIONS.filter || (OPTIONS['ember-source'] && OPTIONS['ember-data'])) {
    main();
  } else {
    usage();
    process.exitCode = 1;
    return;
  }
}

function isEmberDataPackage(packageName) {
  return packageName.includes('ember-data');
}

module.exports = { PACKAGE_FILES, updateDependencies };
