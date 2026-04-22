/*

This utility processes the argument passed with the `lang` option
in ember-cli, i.e. `ember (new||init||addon) app-name --lang=langArg`

Execution Context (usage, input, output, error handling, etc.):
  - called directly by `init` IFF `--lang` flag is used in (new||init||addon)
  - receives single input: the argument passed with `lang` (herein `langArg`)
  - processes `langArg`: lang code validation + error detection / handling
  - DOES emit Warning messages if necessary
  - DOES NOT halt execution process / throw errors / disrupt the build
  - returns single result as output (to `init`):
    - `langArg` (if it is a valid language code)
    - `undefined` (otherwise)
  - `init` assigns the value of `commandOptions.lang` to the returned result
  - downstream, the `lang` attribute is assigned via inline template control:
    - file: `blueprints/app/files/app/index.html`
    - logic: `<html<% if(lang) { %> lang="<%= lang %>"<% } %>>

Internal Mechanics -- the utility processes `langArg` to determine:
  - the value to return to `init` (i.e. validated lang code or undefined)
  - a descriptive category for the usage: `correct`, `incorrect`, `edge`, etc.
  - what message text (if any: category-dependent) to emit before return

Warning Messages (if necessary):
  - An internal instance of `console-ui` is used to emit messages
  - IFF there is a message, it will be emitted before returning the result
  - Components of all emitted messages -- [Name] (writeLevel): 'example':
    - [`HEAD`] (WARNING): 'A warning was generated while processing `--lang`:'
    - [`BODY`] (WARNING): 'Invalid language code, `en-UK`'
    - [`STATUS`] (WARNING): '`lang` will NOT be set to `en-UK` in `index.html`'
    - [`HELP`]    (INFO): 'Correct usage of `--lang`: ... '

*/

'use strict';

const { isLangCode } = require('is-language-code');

function isValidLangCode(langArg) {
  return isLangCode(langArg).res;
}

function getLangArg(langArg) {
  return isValidLangCode(langArg) ? langArg : undefined;
}
const MSG_HELP = `If this was not your intention, you may edit the \`<html>\` element's
  \`lang\` attribute in \`index.html\` manually after the process is complete.
Information about using the \`--lang\` flag:
  The \`--lang\` flag sets the base human language of an app or test app:
    - \`app/index.html\` (app)
    - \`tests/dummy/app/index.html\` (addon test app)
  If used, the lang option must specfify a valid language code.
  For default behavior, remove the flag.
  See \`ember <command> help\` for more information.`;

module.exports = getLangArg;
module.exports.MSG_HELP = MSG_HELP;
