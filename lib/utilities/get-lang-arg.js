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

// Primary language code validation function (boolean)
function isValidLangCode(langArg) {
  return isLangCode(langArg).res;
}

// Generates the result to pass back to `init`
function getResult(langArg) {
  return isValidLangCode(langArg) ? langArg : undefined;
}

/*
Misuse case: attempt to set application programming language via `lang`
AND
Edge case: valid language code AND a common programming language abbreviation
-------------------------------------------------------------------------------
It is possible that a user might mis-interpret the type of `language` that is
specified by the `--lang` flag. One notable potential `misuse case` is one in
which the user thinks `--lang` specifies the application's programming
language. For example, the user might call `ember new my-app --lang=typescript`
expecting to achieve an effect similar to the one provided by the
`ember-cli-typescript` addon.

This misuse case is handled by checking the input `langArg` against an Array
containing notable programming language-related values: language names
(e.g. `JavaScript`), abbreviations (e.g. `js`), file extensions (e.g. `.js`),
or versions (e.g. `ES6`), etc. Specifically, if `langArg` is found within this
reference list, a WARNING message that describes correct `--lang` usage will
be emitted. The `lang` attribute will not be assigned in `index.html`, and the
user will be notified with a corresponding STATUS message.

There are several edge cases (marked) where `langArg` is both a commonly-used
abbreviation for a programming language AND a valid language code. The behavior
for these cases is to assume the user has used `--lang` correctly and set the
`lang` attribute to the valid code in `index.html`. To cover for potential
misuage, several helpful messages will also be emitted:
- `ts` is a valid language code AND a common programming language abbreviation
- the `lang` attribute will be set to `ts` in the application
- if this is not correct, it can be changed in `app/index.html` directly
- (general `help` information about correct `--lang` usage)
*/
const PROG_LANGS = [
  'javascript',
  '.js',
  'js',
  'emcascript2015',
  'emcascript6',
  'es6',
  'emcascript2016',
  'emcascript7',
  'es7',
  'emcascript2017',
  'emcascript8',
  'es8',
  'emcascript2018',
  'emcascript9',
  'es9',
  'emcascript2019',
  'emcascript10',
  'es10',
  'typescript',
  '.ts',
  'node.js',
  'node',
  'handlebars',
  '.hbs',
  'hbs',
  'glimmer',
  'glimmer.js',
  'glimmer-vm',
  'markdown',
  'markup',
  'html5',
  'html4',
  '.md',
  '.html',
  '.htm',
  '.xhtml',
  '.xml',
  '.xht',
  'md',
  'html',
  'htm',
  'xhtml',
  '.sass',
  '.scss',
  '.css',
  'sass',
  'scss',
  // Edge Cases
  'ts', // Tsonga
  'TS', // Tsonga (case insensitivity check)
  'xml', // Malaysian Sign Language
  'xht', // Hattic
  'css', // Costanoan
];

function isProgLang(langArg) {
  return langArg && PROG_LANGS.includes(langArg.toLowerCase().trim());
}

function isValidCodeAndProg(langArg) {
  return isValidLangCode(langArg) && isProgLang(langArg);
}

/*
Misuse case: `--lang` called without `langArg` (NB: parser bug workaround)
-------------------------------------------------------------------------------
This is a workaround for handling an existing bug in the ember-cli parser
where the `--lang` option is specified in the command without a corresponding
value for `langArg`.

As examples, the parser behavior would likely affect the following usages:
  1. `ember new app-name --lang --skip-npm
  2. `ember new app-name --lang`

In this context, the unintended parser behavior is that `langArg` will be
assigned to the String that immediately follows `--lang` in the command. If
`--lang` is the last explicitly defined part of the command (as in the second
example above), the first of any any `hidden` options pushed onto the command
after the initial parse (e.g. `--no-watcher`) will be
used when assigning `langArg`.

In the above examples, `langArg` would likely be assigned as follows:
  1. `ember new app-name --lang --skip-npm => `langArg='--skip-npm'`

The workaround implemented herein is to check whether or not the value of
`langArg` starts with a hyphen. The rationale for this approach is based on
the following underlying assumptions:
  - ALL CLI options start with (at least one) hyphen
  - NO valid language codes start with a hyphen

If the leading hyphen is detected, the current behavior is to assume `--lang`
was declared without a corresponding specification. A WARNING message that
describes correct `--lang` usage will be emitted. The `lang` attribute will not
be assigned in `index.html`, and the user will be notified with a corresponding
STATUS message. Execution will not be halted.

Other complications related to this parser behavior are considered out-of-scope
and not handled here. In the first example above, this workaround would ensure
that `lang` is not assigned to `--skip-npm`, but it would not guarantee that
`--skip-npm` is correctly processed as a command option. That is, `npm` may or
may not get skipped during execution.
*/

function startsWithHyphen(langArg) {
  return langArg && langArg[0] === '-';
}

// MESSAGE GENERATION:
// 1. `HEAD` Message: template for all `--lang`-related warnings emitted
const MSG_HEAD = `An issue with the \`--lang\` flag returned the following message:`;

// 2. `BODY` Messages: category-dependent context information

// Message context from language code validation (valid: null, invalid: reason)
function getLangCodeMsg(langArg) {
  return isLangCode(langArg).message;
}

// Edge case: valid language code AND a common programming language abbreviation
function getValidAndProgMsg(langArg) {
  return `The \`--lang\` flag has been used with argument \`${langArg}\`,
  which is BOTH a valid language code AND an abbreviation for a programming language.
  ${getProgLangMsg(langArg)}`;
}

// Misuse case: attempt to set application programming language via `lang`
function getProgLangMsg(langArg) {
  return `Trying to set the app programming language to \`${langArg}\`?
  This is not the intended usage of the \`--lang\` flag.`;
}

// Misuse case: `--lang` called without `langArg` (NB: parser bug workaround)
function getCliMsg() {
  return `Detected a \`--lang\` specification starting with command flag \`-\`.
  This issue is likely caused by using the \`--lang\` flag without a specification.`;
}

// 3. `STATUS` message: report if `lang` will be set in `index.html`
function getStatusMsg(langArg, willSet) {
  return `The human language of the application will ${willSet ? `be set to ${langArg}` : `NOT be set`} in
  the \`<html>\` element's \`lang\` attribute in \`index.html\`.`;
}

// 4. `HELP` message: template for all `--lang`-related warnings emitted
const MSG_HELP = `If this was not your intention, you may edit the \`<html>\` element's
  \`lang\` attribute in \`index.html\` manually after the process is complete.
Information about using the \`--lang\` flag:
  The \`--lang\` flag sets the base human language of an app or test app:
    - \`app/index.html\` (app)
    - \`tests/dummy/app/index.html\` (addon test app)
  If used, the lang option must specfify a valid language code.
  For default behavior, remove the flag.
  See \`ember <command> help\` for more information.`;

function getBodyMsg(langArg) {
  return isValidCodeAndProg(langArg)
    ? getValidAndProgMsg(langArg)
    : isProgLang(langArg)
    ? getProgLangMsg(langArg)
    : startsWithHyphen(langArg)
    ? getCliMsg(langArg)
    : getLangCodeMsg(langArg);
}

function getFullMsg(langArg) {
  return {
    head: MSG_HEAD,
    body: getBodyMsg(langArg),
    status: getStatusMsg(langArg, isValidCodeAndProg(langArg)),
    help: MSG_HELP,
  };
}

function writeFullMsg(fullMsg, ui) {
  ui.setWriteLevel('WARNING');
  ui.writeWarnLine(`${fullMsg.head}\n  ${fullMsg.body}\``);
  ui.writeWarnLine(fullMsg.status);
  ui.setWriteLevel('INFO');
  ui.writeInfoLine(fullMsg.help);
}

module.exports = function getLangArg(langArg, ui) {
  let fullMsg = getFullMsg(langArg);
  if (fullMsg.body) {
    writeFullMsg(fullMsg, ui);
  }
  return getResult(langArg);
};
