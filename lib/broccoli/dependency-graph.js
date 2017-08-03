'use strict';

const fs = require('fs-extra');
const path = require('path');
const Plugin = require('broccoli-plugin');
const walkSync = require('walk-sync');
const mrDepWalk = require('mr-dep-walk');

function normalizeEdgeKey(fromId, toId, type) {
  return type ? `${type}:${fromId}:${toId}` : `${fromId}:${toId}`;
}

function normalizeFileName(path) {
  return path.replace(/^addon-tree-output\//g, '');
}

// function normalizeModuleName(namespace, split) {
//   let result = namespace;
//   if (namespace === 'addon-tree-output') {
//     if (split[1] === 'modules') {
//       result = split[2];
//     } else {
//       result = split[1];
//     }
//   }
//
//   return result;
// }

// b/c I'm lazy
let edgeId = 0;
let fileId = 0;

class Edge {
  constructor(id, from, to, type) {
    this.id = edgeId++;
    this.from = from;
    this.to = to;
    this.type = type;
  }

  toJson() {
    return {
      id: this.id,
      from: this.from,
      type: this.type,
      to: this.to,
    };
  }
}

class Node {
  constructor(id) {
    this.id = id;
  }

  toJson() {
    return {
      id: this.id,
    };
  }
}

class File {
  constructor(path) {
    this.id = fileId++;
    this.filePath = path;
  }

  toJson() {
    return {
      id: this.id,
    };
  }
}

class Graph {
  constructor() {
    this._files = null;
    this.nodes = new Map();
    this.edges = new Map();
    this.files = new Map();
  }

  addNode(id) {
    let newNode = new Node(id);
    this.nodes.set(id, newNode);
    return newNode;
  }

  nodeFor(id) {
    if (this.nodes.has(id)) {
      return this.nodes.get(id);
    }

    return this.addNode(id);
  }

  fileFor(id) {
    if (this.files.has(id)) {
      return this.files.get(id);
    }

    let newFile = new File(id);
    this.files.set(id, newFile);
    return newFile;
  }

  subgraphFor(id) {
    let node = this.nodeFor(id);
    let edges = [...this.edges.values()].filter(edge => node === edge.from);

    let nodes = edges.map(edge => edge.to);

    return {
      nodes: nodes.concat(node),
      edges,
    };
  }

  outerEdgesFor(id, type) {
    let node = this.nodeFor(id);

    return {
      node,
      children: [...this.edges.values()].filter(edge => {
        let isNode = node === edge.from;

        if (type) {
          return isNode && edge.type === type;
        }

        return isNode;
      }),
    };
  }

  edgeFor(from, to, type) {
    let key = normalizeEdgeKey(from.id, to.id, type);

    if (this.edges.has(key)) {
      return this.edges.get(key);
    }

    let newEdge = new Edge(key, from, to, type);
    this.edges.set(key, newEdge);
    return newEdge;
  }

  syntheticEdgeFor(from, to) {
    return this.edgeFor(from, to, 'synthetic');
  }

  implicitEdgeFor(from, to) {
    return this.edgeFor(from, to, 'implicit');
  }

  discover(name) {
    if (this._files) { return this._files; }

    let files = { };
    let filename;

    try {
      let directory = this.path;

      // rooted node
      let node = this.nodeFor(name);

      walkSync(directory, { directories: false, globs: ['**/*.js'] }).map(f => {
        filename = f;

        if (f.startsWith(name)) {
          if (!files[name]) {
            files[name] = {};
          }

          let fileNode = this.fileFor(f);
          this.edgeFor(node, fileNode, 'synthetic');

          // let deps = mrDepWalk.depsFromFile(path.join(directory, f));
          let deps = mrDepWalk.depFilesFromFile(directory, { entry: f });

          deps.map(x => {
            this.edgeFor(fileNode, this.nodeFor(x));
          });

          files[name][f] = deps;
        }
      });
    } catch(e) {
      console.log(e, filename);
    }

    this._files = files;

    return files;
  }

  save(name) {
    fs.writeJsonSync(
      path.join(process.cwd(), name),
      this.toJson()
    );
  }

  saveGraph(name) {
    fs.writeJsonSync(
      path.join(process.cwd(), name),
      this.graphToJson()
    );
  }

  saveSubgraph(name, type) {
    let f = this.subgraphFor(name);
    let filePath;
    if (type) {
      filePath = path.join(process.cwd(), `${name}-${type}.json`);
    } else {
      filePath = path.join(process.cwd(), `${name}.json`);
    }
    fs.writeJsonSync(filePath, f);
  }

  graphToJson() {
    return {
      edges: [...this.edges.values()].map(x => x.toJson()),
      nodes: [...this.nodes.values()].map(x => x.toJson()),
    };
  }

  toJson() {
    return JSON.stringify(this._files);
  }

  getRootedNode() {
    return this.rootedNode;
  }

  removeEdge(from, to) {
    let key = normalizeEdgeKey(from.id, to.id, type);

    debugger;
  }
}

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

  discover(directory) {
    let files = walkSync(directory, {
      directories: false,
      globs: [
        `*(${this.rootedNodeName}|addon-tree-output)/**/*.js`,
      ],
    });

    fs.writeJsonSync(path.join(process.cwd(), 'files.json'), files);

    return files.map(filePath => {
      return {
        name: normalizeFileName(filePath),
        filePath,
      };
    });
  }

  build() {
    let graph = new Graph();
    let directory = this._inputNodes[0].outputPath;

    // discovery process
    let files = this.discover(directory);
    let node = graph.addNode(this.rootedNodeName);
    graph.rootedNode = node;

    files.map(fileMeta => {
      let moduleName = fileMeta.name;
      let filePath = fileMeta.filePath;

      let fileNode = graph.fileFor(filePath);
      graph.syntheticEdgeFor(node, fileNode);

      // let deps = mrDepWalk.depFilesFromFile(directory, { entry: filePath });
      let deps = mrDepWalk.depsFromFile(path.join(directory, filePath));
      debugger

      deps.map(x => {
        let depFileNode = graph.fileFor(x);
        graph.syntheticEdgeFor(fileNode, depFileNode);

        // if (filePath.startsWith('addon-tree-output')) {
        //   let nodeName = filePath.split('/')[1];
        //   let groupNode = graph.nodeFor(nodeName);

        //   graph.implicitEdgeFor(groupNode, s);
        // }
      });
    });

    // graph.saveSubgraph('ember-ajax');
    graph.saveSubgraph('ember-wormhole');
    // graph.saveSubgraph('ember-cli-pemberly-i18n');
    // graph.saveSubgraph(this.rootedNodeName, 'synthetic');
    // graph.saveSubgraph(this.rootedNodeName, 'implicit');

    // does this even make sense?
    // graph.exclude('ember-wormhole');
    // graph.removeEdge(graph.getRootedNode(), graph.nodeFor('ember-wormwhole'));

    // graph.save('app-bundle.json');
    // graph.saveGraph('app-graph.json');
  }
};
