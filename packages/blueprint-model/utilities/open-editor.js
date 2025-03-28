'use strict';

const spawn = require('child_process').spawn;

function openEditor(file) {
  if (!openEditor.canEdit()) {
    throw new Error('EDITOR environment variable is not set');
  }

  if (!file) {
    throw new Error('No `file` option provided');
  }

  let editorArgs = openEditor._env().EDITOR.split(' ');
  let editor = editorArgs.shift();
  const args = [file].concat(editorArgs);
  let editProcess = openEditor._spawn(editor, args, { stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    editProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Spawn('${editor}', [${args.join(',')}]) exited with a non zero error status code: '${code}'`)
        );
      }
    });
  });
}

openEditor.canEdit = function () {
  return openEditor._env().EDITOR !== undefined;
};

openEditor._env = function () {
  return process.env;
};

openEditor._spawn = function () {
  return spawn.apply(this, arguments);
};

module.exports = openEditor;
