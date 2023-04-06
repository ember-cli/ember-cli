'use strict';

const getLangArg = require('../../../lib/utilities/get-lang-arg');
const { expect } = require('chai');
const MockUI = require('console-ui/mock');

describe('lib/utilities/get-lang-arg', function () {
  // Reference object with snippets of case-dependent messages for comparison
  let msgRef = {
    severity: 'WARNING',
    head: 'An issue with the `--lang` flag returned the following message:',
    help: {
      edit: 'If this was not your intention, you may edit the `<html>` element',
      info: {
        head: 'Information about using the `--lang` flag:',
        desc: 'The `--lang` flag sets the base human language of an app or test app:',
        usage: 'If used, the lang option must specfify a valid language code.',
        default: 'For default behavior, remove the flag',
        more: 'See `ember <command> help` for more information.',
      },
    },
    body: {
      valid: '',
      validAndProg: 'which is BOTH a valid language code AND an abbreviation for a programming language',
      prog: 'Trying to set the app programming language to ',
      cliOpt: 'Detected a `--lang` specification starting with command flag `-`',
    },
    status: {
      willSet: 'The human language of the application will be set to',
      willNotSet: 'The human language of the application will NOT be set',
    },
  };

  let ui;

  beforeEach(function () {
    ui = new MockUI();
  });

  describe('Valid language codes', function () {
    ['en', 'en-gb', 'en-GB', 'EN', 'EN-gb', 'EN-GB'].forEach((langArg) => {
      it(`'${langArg}' is a valid language code`, function () {
        expect(() => {
          getLangArg(langArg, ui);
        }).not.to.throw();
        expect(getLangArg(langArg, ui)).to.equal(langArg);
        expect(ui.output).to.equal(msgRef.body.valid);
      });
    });
  });

  describe('Edge Cases: valid language codes + programming languages', function () {
    [
      'ts', // Tsonga
      'TS', // Tsonga (case insensitivity check)
      'xml', // Malaysian Sign Language
      'xht', // Hattic
      'css', // Costanoan
    ].forEach((langArg) => {
      it(`'${langArg}' is a valid language code and programming language`, function () {
        expect(() => {
          getLangArg(langArg, ui);
        }).not.to.throw();
        expect(getLangArg(langArg, ui)).to.equal(langArg);
        expect(ui.output).to.contain(msgRef.severity);
        expect(ui.output).to.contain(msgRef.head);
        expect(ui.output).to.contain(msgRef.help.edit);
        expect(ui.output).to.contain(msgRef.help.info.head);
        expect(ui.output).to.contain(msgRef.help.info.desc);
        expect(ui.output).to.contain(msgRef.help.info.usage);
        expect(ui.output).to.contain(msgRef.help.info.default);
        expect(ui.output).to.contain(msgRef.help.info.more);
        expect(ui.output).to.contain(msgRef.status.willSet);
        expect(ui.output).to.contain(msgRef.body.validAndProg);
        expect(ui.output).to.contain(msgRef.body.prog);
        expect(ui.output).to.not.contain(msgRef.body.cliOpt);
      });
    });
  });

  describe('Invalid lang Flags: Misc.', function () {
    ['', '..-..', '12-34', ' en', 'en ', 'en-uk', 'en-UK', 'EN-uk', 'EN-UK', 'en-cockney'].forEach((langArg) => {
      it(`'${langArg}' is an invalid language argument; not related misuse cases`, function () {
        expect(() => {
          getLangArg(langArg, ui);
        }).not.to.throw();
        expect(getLangArg(langArg, ui)).to.equal(undefined);
        expect(ui.output).to.contain(msgRef.severity);
        expect(ui.output).to.contain(msgRef.head);
        expect(ui.output).to.contain(msgRef.help.edit);
        expect(ui.output).to.contain(msgRef.help.info.head);
        expect(ui.output).to.contain(msgRef.help.info.desc);
        expect(ui.output).to.contain(msgRef.help.info.usage);
        expect(ui.output).to.contain(msgRef.help.info.default);
        expect(ui.output).to.contain(msgRef.help.info.more);
        expect(ui.output).to.contain(msgRef.status.willNotSet);
        expect(ui.output).to.not.contain(msgRef.body.validAndProg);
        expect(ui.output).to.not.contain(msgRef.body.prog);
        expect(ui.output).to.not.contain(msgRef.body.cliOpt);
      });
    });
  });

  describe('Invalid Language Flags, Misuse case: Programming Languages', function () {
    [
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

      // + case-insensitivity
      'JavaScript',
      'JAVASCRIPT',
      'JS',
      '.JS',
      'EMCAScript2015',
      'EMCAScript6',
      'ES6',
      'TypeScript',
      'TYPESCRIPT',
      '.TS',
    ].forEach((langArg) => {
      it(`'${langArg}' is an invalid lang argument; possibly an attempt to set app programming language`, function () {
        expect(() => {
          getLangArg(langArg, ui);
        }).not.to.throw();
        expect(getLangArg(langArg, ui)).to.equal(undefined);
        expect(ui.output).to.contain(msgRef.severity);
        expect(ui.output).to.contain(msgRef.head);
        expect(ui.output).to.contain(msgRef.help.edit);
        expect(ui.output).to.contain(msgRef.help.info.head);
        expect(ui.output).to.contain(msgRef.help.info.desc);
        expect(ui.output).to.contain(msgRef.help.info.usage);
        expect(ui.output).to.contain(msgRef.help.info.default);
        expect(ui.output).to.contain(msgRef.help.info.more);
        expect(ui.output).to.contain(msgRef.status.willNotSet);
        expect(ui.output).to.not.contain(msgRef.body.validAndProg);
        expect(ui.output).to.contain(msgRef.body.prog);
        expect(ui.output).to.not.contain(msgRef.body.cliOpt);
      });
    });
  });

  describe('Invalid Language Flags, Misuse case: ember-cli `new` and `init` options / aliases', function () {
    [
      '--disable-analytics',
      '--watcher=node',
      '--dry-run',
      '-d',
      '--verbose',
      '-v',
      '--blueprint',
      '-b',
      '--skip-npm',
      '-sn',
      '--skip-bower',
      '-sb',
      '--welcome',
      '--no-welcome',
      '--yarn',
      '--name',
      '--skip-git',
      '-sg',
      '--directory',
      '-dir',
    ].forEach((langArg) => {
      it(`'${langArg}' is an invalid language argument; possibly an absorbed ember-cli command option`, function () {
        expect(() => {
          getLangArg(langArg, ui);
        }).not.to.throw();
        expect(getLangArg(langArg, ui)).to.equal(undefined);
        expect(getLangArg(langArg, ui)).to.equal(undefined);
        expect(ui.output).to.contain(msgRef.severity);
        expect(ui.output).to.contain(msgRef.head);
        expect(ui.output).to.contain(msgRef.help.edit);
        expect(ui.output).to.contain(msgRef.help.info.head);
        expect(ui.output).to.contain(msgRef.help.info.desc);
        expect(ui.output).to.contain(msgRef.help.info.usage);
        expect(ui.output).to.contain(msgRef.help.info.default);
        expect(ui.output).to.contain(msgRef.help.info.more);
        expect(ui.output).to.contain(msgRef.status.willNotSet);
        expect(ui.output).to.not.contain(msgRef.body.validAndProg);
        expect(ui.output).to.not.contain(msgRef.body.prog);
        expect(ui.output).to.contain(msgRef.body.cliOpt);
      });
    });
  });
});
