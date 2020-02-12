'use strict';

const path = require('path');
const fs = require('fs-extra');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;
const BroccoliPlugin = require('broccoli-plugin');
const walkSync = require('walk-sync');

const MockCLI = require('../../helpers/mock-cli');
const Project = require('../../../lib/models/project');
const Addon = require('../../../lib/models/addon');
const EmberApp = require('../../../lib/broccoli/ember-app');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('template preprocessors', function() {
  let input, output, addon;

  class FakeTemplateColocator extends BroccoliPlugin {
    build() {
      let [inputPath] = this.inputPaths;
      let entries = fs.readdirSync(inputPath);
      if (entries.length > 1) {
        throw new Error('all input files should be scoped to the addon or project name');
      }

      if (entries.length === 0) {
        // nothing to do, no files in input tree
        return;
      }
      let root = entries[0];
      let files = walkSync(path.join(inputPath, root), { directories: false });

      files.forEach(file => {
        let fullInputPath = path.join(inputPath, root, file);
        let fullOutputPath = path.join(this.outputPath, root, file);

        if (file.startsWith(`components/`)) {
          let pathParts = path.parse(file);
          let templatePath = path.join(inputPath, root, 'templates', pathParts.dir, `${pathParts.name}.hbs`);
          let templateContents = fs.readFileSync(templatePath, { encoding: 'utf8' });
          let componentContents = fs.readFileSync(fullInputPath, { encoding: 'utf8' });

          let contents = `${componentContents}\nexport const template = hbs\`${templateContents}\``;
          fs.ensureDirSync(path.dirname(fullOutputPath));
          fs.writeFileSync(fullOutputPath, contents, { encoding: 'utf8' });
        } else if (file.startsWith(`templates/components/`)) {
          // do nothing
        } else {
          fs.copySync(fullInputPath, fullOutputPath);
        }
      });
    }
  }

  describe('Addon', function() {
    beforeEach(async function() {
      input = await createTempDir();
      let MockAddon = Addon.extend({
        root: input.path(),
        name: 'fake-addon',
      });
      let cli = new MockCLI();
      let pkg = { name: 'ember-app-test' };
      let project = new Project(input.path(), pkg, cli.ui, cli);

      addon = new MockAddon(project, project);

      addon.registry.add('js', {
        name: 'fake-js-compiler',
        ext: 'js',
        toTree(tree) {
          return tree;
        },
      });
    });

    afterEach(async function() {
      await input.dispose();
      await output.dispose();
    });

    it('the template preprocessor receives access to all files', async function() {
      addon.registry.add('template', {
        name: 'fake-template-compiler',
        ext: 'hbs',
        toTree(tree) {
          return new FakeTemplateColocator([tree]);
        },
      });

      input.write({
        addon: {
          components: {
            'awesome-button.js': 'export default class {}',
          },
          templates: {
            components: {
              'awesome-button.hbs': '<!-- flerpy -->',
            },
          },
        },
      });

      output = await buildOutput(addon.treeForAddon(path.join(addon.root, '/addon')));

      expect(output.read()).to.deep.equal({
        'fake-addon': {
          components: {
            'awesome-button.js': `export default class {}\nexport const template = hbs\`<!-- flerpy -->\``,
          },
        },
      });
    });
  });

  describe('EmberApp', function() {
    let project;

    beforeEach(async function() {
      input = await createTempDir();
      let cli = new MockCLI();
      let pkg = { name: 'fake-app-test', devDependencies: { 'ember-cli': '*' } };
      project = new Project(input.path(), pkg, cli.ui, cli);
    });

    afterEach(async function() {
      await input.dispose();
      await output.dispose();
    });

    it('the template preprocessor receives access to all files', async function() {
      input.write({
        app: {
          components: {
            'awesome-button.js': 'export default class {}',
          },
          styles: {
            'app.css': '/* styles */',
          },
          templates: {
            components: {
              'awesome-button.hbs': '<!-- flerpy -->',
            },
          },
          'index.html': '<body></body>',
        },
        config: {
          'environment.js': 'module.exports = function() { return { modulePrefix: "fake-app-test" } };',
        },
      });

      let app = new EmberApp(
        {
          project,
          name: project.pkg.name,
          _ignoreMissingLoader: true,
          sourcemaps: { enabled: false },
        },
        {}
      );

      app.registry.add('js', {
        name: 'fake-js-compiler',
        ext: 'js',
        toTree(tree) {
          return tree;
        },
      });

      app.registry.add('template', {
        name: 'fake-template-compiler',
        ext: 'hbs',
        toTree(tree) {
          return new FakeTemplateColocator([tree]);
        },
      });

      output = await buildOutput(app.toTree());

      let expectedContent = `export default class {}\nexport const template = hbs\`<!-- flerpy -->\``;
      let actualContent = output.read().assets['fake-app-test.js'];

      expect(actualContent).to.include(expectedContent);
    });
  });
});
