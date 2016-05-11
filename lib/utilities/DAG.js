'use strict';

function visit(vertex, fn, visited, path) {
  var name = vertex.name,
      vertices = vertex.incoming,
      names = vertex.incomingNames,
      len = names.length,
      i;
  if (!visited) {
    visited = {};
  }
  if (!path) {
    path = [];
  }
  if (visited.hasOwnProperty(name)) {
    return;
  }
  path.push(name);
  visited[name] = true;
  for (i = 0; i < len; i++) {
    visit(vertices[names[i]], fn, visited, path);
  }
  fn(vertex, path);
  path.pop();
}

/**
 * Directed acyclic graph.
 *
 * see [Wikipedia](https://en.wikipedia.org/wiki/Directed_acyclic_graph).
 *
 * @class DAG
 * @constructor
 */
function DAG() {
  /**
   * Array of all known vertex names.
   *
   * @final
   * @property names
   * @type Array
   */
  this.names = [];

  /**
   * Hash of vertices keyed by name.
   *
   * @final
   * @property vertices
   * @type Object
   */
  this.vertices = {};
}

/**
 * Adds a new vertex to the graph.
 *
 * @method add
 * @param {String} name Name of the vertex
 * @return {Object|undefined} The new vertex or the already existing vertex with the same name
 */
DAG.prototype.add = function(name) {
  if (!name) { return; }
  if (this.vertices.hasOwnProperty(name)) {
    return this.vertices[name];
  }
  var vertex = {
    name: name,
    incoming: {},
    incomingNames: [],
    hasOutgoing: false,
    value: null
  };

  this.vertices[name] = vertex;
  this.names.push(name);
  return vertex;
};

/**
 * Assigns `value` to the vertex named `name`.
 *
 * Creates a new vertex if a vertex named `name` does not exist yet.
 *
 * @method map
 * @param {String} name Name of the vertex
 * @param {any} value Value of the vertex
 */
DAG.prototype.map = function(name, value) {
  this.add(name).value = value;
};

/**
 * Adds an edge between two vertices.
 *
 * @method addEdge
 * @param fromName Name of the `from` vertex
 * @param toName Name of the `to` vertex
 * @throws {Error} if a cycle is detected
 */
DAG.prototype.addEdge = function(fromName, toName) {
  if (!fromName || !toName || fromName === toName) {
    return;
  }
  var from = this.add(fromName), to = this.add(toName);
  if (to.incoming.hasOwnProperty(fromName)) {
    return;
  }
  function checkCycle(vertex, path) {
    if (vertex.name === toName) {
      throw new Error('cycle detected: ' + toName + ' <- ' + path.join(' <- '));
    }
  }
  visit(from, checkCycle);
  from.hasOutgoing = true;
  to.incoming[fromName] = from;
  to.incomingNames.push(fromName);
};

/**
 * Traverses the graph depth-first.
 *
 * Each vertex will only be visited once even if it has multiple parent vertices.
 *
 * @method topsort
 * @param {Function} fn Function that is called with each vertex and the path to it
 */
DAG.prototype.topsort = function(fn) {
  var visited = {},
      vertices = this.vertices,
      names = this.names,
      len = names.length,
      i, vertex;
  for (i = 0; i < len; i++) {
    vertex = vertices[names[i]];
    if (!vertex.hasOutgoing) {
      visit(vertex, fn, visited);
    }
  }
};

/**
 * Assigns `value` to the vertex named `name` and creates the edges defined by `before` and `after`.
 *
 * @method addEdges
 * @param {String} name Name of the vertex
 * @param {any} value Value of the vertex
 * @param {String|Array} before Adds edges from `name` to each of `before`
 * @param {String|Array} after Adds edges from each of `after` to `name`
 */
DAG.prototype.addEdges = function(name, value, before, after) {
  var i;
  this.map(name, value);
  if (before) {
    if (typeof before === 'string') {
      this.addEdge(name, before);
    } else {
      for (i = 0; i < before.length; i++) {
        this.addEdge(name, before[i]);
      }
    }
  }
  if (after) {
    if (typeof after === 'string') {
      this.addEdge(after, name);
    } else {
      for (i = 0; i < after.length; i++) {
        this.addEdge(after[i], name);
      }
    }
  }
};

module.exports = DAG;
