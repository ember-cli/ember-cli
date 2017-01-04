'use strict';

const fs = require('fs');
const Promise = require('../ext/promise');
let readFile = Promise.denodeify(fs.readFile);
let writeFile = Promise.denodeify(fs.writeFile);
const jsdiff = require('diff');
const quickTemp = require('quick-temp');
const path = require('path');
const SilentError = require('silent-error');
const openEditor = require('../utilities/open-editor');

function EditFileDiff(options) {
  this.info = options.info;

  quickTemp.makeOrRemake(this, 'tmpDifferenceDir');
}

EditFileDiff.prototype.edit = function() {
  return Promise.hash({
    input: this.info.render(),
    output: readFile(this.info.outputPath),
  })
    .then(invokeEditor.bind(this))
    .then(applyPatch.bind(this))
    .finally(cleanUp.bind(this));
};

function cleanUp() {
  quickTemp.remove(this, 'tmpDifferenceDir');
}

function applyPatch(resultHash) {
  return Promise.hash({
    diffString: readFile(resultHash.diffPath),
    currentString: readFile(resultHash.outputPath),
  }).then(result => {
    let appliedDiff = jsdiff.applyPatch(result.currentString.toString(), result.diffString.toString());

    if (!appliedDiff) {
      let message = 'Patch was not cleanly applied.';
      this.info.ui.writeLine(`${message} Please choose another action.`);
      throw new SilentError(message);
    }

    return writeFile(resultHash.outputPath, appliedDiff);
  });
}

function invokeEditor(result) {
  let info = this.info;
  let diff = jsdiff.createPatch(info.outputPath, result.output.toString(), result.input);
  let diffPath = path.join(this.tmpDifferenceDir, 'currentDiff.diff');

  return writeFile(diffPath, diff)
    .then(() => openEditor(diffPath))
    .then(() => ({ outputPath: info.outputPath, diffPath }));
}

module.exports = EditFileDiff;
