'use strict';

var Promise = require('../ext/promise');
var spawn = require('child_process').spawn;

var openEditor = function(file) {
  if (!openEditor.canEdit()) {
    throw new Error('EDITOR environment variable is not set');
  }

  var editorArgs  = process.env.EDITOR.split(' ');
  var editor      = editorArgs.shift();
  var editProcess = openEditor._spawn(editor, [file].concat(editorArgs), {stdio: 'inherit'});

  return new Promise(function(resolve, reject) {
    editProcess.on('close', function (code) {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

openEditor.canEdit = function() {
  return process.env.EDITOR !== undefined;
};

openEditor._spawn = function() {
  return spawn.apply(this, arguments);
};

module.exports = openEditor;
