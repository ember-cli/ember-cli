'use strict';

const fs = require('fs');
// const fs = require('fs-extra');
const path = require('path');
const GraphAssembler = require('erza').GraphAssembler;
const Plugin = require('broccoli-plugin');
const walkSync = require('walk-sync');
const mrDepWalk = require('mr-dep-walk');
// const Funnel = require('broccoli-funnel');
const symlinkOrCopy = require('symlink-or-copy');
const existsSync = require('exists-sync');
const mkdirp = require('mkdirp');

module.exports = class DependencyGraph extends Plugin {
  constructor(node, options) {
    options = options || {};

    super([node], {
      persistentOutput: true,
      needsCache: false,
      annotation: options.annotation || 'Dep Graph',
    });
    this.name = options.name;
    this.rootedNodeName = options.rootedNodeName || options.name;
  }

  _copy(sourcePath, destPath) {
    const destDir = path.dirname(destPath);

    try {
      symlinkOrCopy.sync(sourcePath, destPath);
    } catch(e) {
      if (!existsSync(destDir)) {
        mkdirp.sync(destDir);
      }
      try {
        fs.unlinkSync(destPath);
      } catch(e) {
        // swallow the error
      }
      symlinkOrCopy.sync(sourcePath, destPath);
    }
  }

  build() {
    let hash = [];
    let directory = this._inputNodes[0].outputPath;

    const files = walkSync(directory, {
      directories: false,
      globs: [
        `*(${this.rootedNodeName}|addon-tree-output)/**/*.js`,
      ],
    });

    // debugger;

    files.map(f => {
      hash.push({
        [f]: mrDepWalk.depFilesFromFile(directory, { entry: f }),
      });
    });

    // console.log(GraphAssembler); console.log(hash);
    // const fsExtra = require('fs-extra');
    // fsExtra.writeJsonSync(
    //   path.join(process.cwd(), 'hash.json'),
    //   hash
    // );
    const graph = new GraphAssembler(this.rootedNodeName, hash);
    const list = graph.toList();
    const exclude = graph.getEvicted();
    console.log(exclude);

    let destVendorPath = path.join(this.outputPath, 'vendor');
    let inputVendorPath = path.join(directory, 'vendor');

    this._copy(
      inputVendorPath,
      destVendorPath
    );

    list.forEach(p => {
      if (p !== 'addon-tree-output/module.js' && p !== 'addon-tree-output/ember.js' && p !== 'addon-tree-output/ember-component.js' && p !== 'ember-component.js') {
        let inputPath, destPath;

        if (p.endsWith('config/environment.js')) {
          inputPath = path.join(directory, `${this.rootedNodeName}/config/environments`);
          destPath = path.join(this.outputPath, `${this.rootedNodeName}/config/environments`);
        } else if (p.startsWith('addon-tree-output/ember-data')) {
          inputPath = path.join(directory, p.replace('ember-data', 'modules/ember-data'));
          destPath = path.join(this.outputPath, p.replace('ember-data', 'modules/ember-data'));
        } else {
          inputPath = path.join(directory, p);
          destPath = path.join(this.outputPath, p);
        }

        if (inputPath.includes('module.js') || destPath.includes('module.js')) {
          debugger
        }

        this._copy(inputPath, destPath);
      }
    });
  }
};

