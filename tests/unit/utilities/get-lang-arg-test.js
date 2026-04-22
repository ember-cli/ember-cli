'use strict';

const getLangArg = require('../../../lib/utilities/get-lang-arg');
const { MSG_HELP } = getLangArg;
const { expect } = require('chai');
const MockUI = require('console-ui/mock');

describe('lib/utilities/get-lang-arg', function () {
  let ui;

  beforeEach(function () {
    ui = new MockUI();
  });

  describe('Valid language codes', function () {
    ['en', 'en-gb', 'en-GB', 'EN', 'EN-gb', 'EN-GB'].forEach((langArg) => {
      it(`'${langArg}' is a valid language code`, function () {
        expect(getLangArg(langArg, ui)).to.equal(langArg);
        expect(ui.output).to.equal('');
      });
    });
  });

  describe('Invalid language arguments', function () {
    [
      '',
      '..-..',
      '12-34',
      ' en',
      'en ',
      'en-uk',
      'en-UK',
      'EN-uk',
      'EN-UK',
      'en-cockney',
      'javascript',
      '.js',
      'js',
      'typescript',
      '.ts',
      '--watcher=node',
      '--dry-run',
      '-d',
      '--skip-npm',
      '--pnpm',
      '--directory',
      '-dir',
    ].forEach((langArg) => {
      it(`returns undefined for invalid lang argument: '${langArg}'`, function () {
        expect(getLangArg(langArg, ui)).to.equal(undefined);
        expect(ui.output).to.equal('');
      });
    });
  });

  it('exports centralized --lang help text', function () {
    expect(MSG_HELP).to.contain('Information about using the `--lang` flag:');
    expect(MSG_HELP).to.contain('`app/index.html`');
    expect(MSG_HELP).to.contain('`tests/dummy/app/index.html`');
  });
});
