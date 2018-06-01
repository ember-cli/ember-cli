'use strict';

const fs = require('fs');
const RSVP = require('rsvp');
const jsdiff = require('diff');
const quickTemp = require('quick-temp');
const path = require('path');
const SilentError = require('silent-error');
const openEditor = require('../utilities/open-editor');

const readFile = RSVP.denodeify(fs.readFile);
const writeFile = RSVP.denodeify(fs.writeFile);

class EditFileDiff {
  constructor(options) {
    this.info = options.info;

    quickTemp.makeOrRemake(this, 'tmpDifferenceDir');
  }

  edit() {
    return RSVP.hash({
      input: this.info.render(),
      output: readFile(this.info.outputPath),
    })
      .then(this.invokeEditor.bind(this))
      .then(this.applyPatch.bind(this))
      .finally(this.cleanUp.bind(this));
  }

  cleanUp() {
    quickTemp.remove(this, 'tmpDifferenceDir');
  }

  applyPatch(resultHash) {
    return RSVP.hash({
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

  invokeEditor(result) {
    let { info } = this;
    let diff = jsdiff.createPatch(info.outputPath, result.output.toString(), result.input);
    let diffPath = path.join(this.tmpDifferenceDir, 'currentDiff.diff');

    return writeFile(diffPath, diff)
      .then(() => openEditor(diffPath))
      .then(() => ({ outputPath: info.outputPath, diffPath }));
  }
}

module.exports = EditFileDiff;
