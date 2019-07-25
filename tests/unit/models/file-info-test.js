'use strict';

const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const FileInfo = require('../../../lib/models/file-info');
const path = require('path');
const fs = require('fs-extra');
const EOL = require('os').EOL;
const RSVP = require('rsvp');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const td = require('testdouble');

const Promise = RSVP.Promise;
const writeFile = RSVP.denodeify(fs.writeFile);

let root = process.cwd();
let tmproot = path.join(root, 'tmp');

describe('Unit - FileInfo', function() {
  let validOptions, ui, testOutputPath;

  beforeEach(function() {
    return mkTmpDirIn(tmproot).then(function(tmpdir) {
      testOutputPath = path.join(tmpdir, 'outputfile');

      ui = new MockUI();
      td.replace(ui, 'prompt');

      validOptions = {
        action: 'write',
        outputPath: testOutputPath,
        displayPath: '/pretty-output-path',
        inputPath: path.resolve(__dirname, '../../fixtures/blueprints/with-templating/files/foo.txt'),
        templateVariables: {},
        ui,
      };
    });
  });

  afterEach(function(done) {
    td.reset();
    fs.remove(tmproot, done);
  });

  it('can instantiate with options', function() {
    new FileInfo(validOptions);
  });

  // eslint-disable-next-line no-template-curly-in-string
  it('does not interpolate {{ }} or ${ }', function() {
    let options = {};
    Object.assign(options, validOptions, {
      inputPath: path.resolve(__dirname, '../../fixtures/file-info/interpolate.txt'),
      templateVariables: { name: 'tacocat' },
    });
    let fileInfo = new FileInfo(options);
    return fileInfo.render().then(function(output) {
      // eslint-disable-next-line no-template-curly-in-string
      expect(output.trim()).to.equal('{{ name }} ${ name }  tacocat tacocat');
    });
  });

  it('renders an input file', function() {
    validOptions.templateVariables.friend = 'Billy';
    let fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output) {
      expect(output.trim()).to.equal('Howdy Billy', 'expects the template to have been run');
    });
  });

  it('allows mutation to the rendered file', function() {
    validOptions.templateVariables.friend = 'Billy';
    let fileInfo;

    validOptions.replacer = function(content, theFileInfo) {
      expect(theFileInfo).to.eql(fileInfo);
      expect(content).to.eql('Howdy Billy\n');

      return content.toUpperCase();
    };

    fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output) {
      expect(output.trim()).to.equal('HOWDY BILLY', 'expects the template to have been run');
    });
  });

  it('rejects if templating throws', function() {
    let templateWithUndefinedVariable = path.resolve(
      __dirname,
      '../../fixtures/blueprints/with-templating/files/with-undefined-variable.txt'
    );
    let options = {};
    Object.assign(options, validOptions, { inputPath: templateWithUndefinedVariable });
    let fileInfo = new FileInfo(options);

    return fileInfo
      .render()
      .then(function() {
        throw new Error('FileInfo.render should reject if templating throws');
      })
      .catch(function(e) {
        if (!e.toString().match(/ReferenceError/)) {
          throw e;
        }
      });
  });

  it('does not explode when trying to template binary files', function() {
    let binary = path.resolve(__dirname, '../../fixtures/problem-binary.png');

    validOptions.inputPath = binary;

    let fileInfo = new FileInfo(validOptions);

    return fileInfo.render().then(function(output) {
      expect(!!output, 'expects the file to be processed without error').to.equal(true);
    });
  });

  it('renders a diff to the UI', function() {
    validOptions.templateVariables.friend = 'Billy';
    let fileInfo = new FileInfo(validOptions);

    return writeFile(testOutputPath, `Something Old${EOL}`)
      .then(function() {
        return fileInfo.displayDiff();
      })
      .then(function() {
        let output = ui.output.trim().split(EOL);
        expect(output.shift()).to.equal(`Index: ${testOutputPath}`);
        expect(output.shift()).to.match(/=+/);
        expect(output.shift()).to.match(/---/);
        expect(output.shift()).to.match(/\+{3}/);
        expect(output.shift()).to.match(/.*/);
        expect(output.shift()).to.match(/-Something Old/);
        expect(output.shift()).to.match(/\+Howdy Billy/);
      });
  });

  it('renders a menu with an overwrite option', function() {
    td.when(ui.prompt(td.matchers.anything())).thenReturn(Promise.resolve({ answer: 'overwrite' }));

    let fileInfo = new FileInfo(validOptions);

    return fileInfo.confirmOverwrite('test.js').then(function(action) {
      td.verify(ui.prompt(td.matchers.anything()), { times: 1 });
      expect(action).to.equal('overwrite');
    });
  });

  it('renders a menu with a skip option', function() {
    td.when(ui.prompt(td.matchers.anything())).thenReturn(Promise.resolve({ answer: 'skip' }));

    let fileInfo = new FileInfo(validOptions);

    return fileInfo.confirmOverwrite('test.js').then(function(action) {
      td.verify(ui.prompt(td.matchers.anything()), { times: 1 });
      expect(action).to.equal('skip');
    });
  });

  it('renders a menu with a diff option', function() {
    td.when(ui.prompt(td.matchers.anything())).thenReturn(Promise.resolve({ answer: 'diff' }));

    let fileInfo = new FileInfo(validOptions);

    return fileInfo.confirmOverwrite('test.js').then(function(action) {
      td.verify(ui.prompt(td.matchers.anything()), { times: 1 });
      expect(action).to.equal('diff');
    });
  });

  it('renders a menu without diff and edit options when dealing with binary files', function() {
    td.when(ui.prompt(td.matchers.anything())).thenReturn(Promise.resolve({ answer: 'skip' }));

    let binary = path.resolve(__dirname, '../../fixtures/problem-binary.png');
    validOptions.inputPath = binary;
    let fileInfo = new FileInfo(validOptions);

    return fileInfo.confirmOverwrite('test.png').then(function(/* action */) {
      td.verify(
        ui.prompt(
          td.matchers.argThat(function(options) {
            return options.choices.length === 2 && options.choices[0].key === 'y' && options.choices[1].key === 'n';
          })
        )
      );
    });
  });

  it('normalizes line endings before comparing files', function() {
    if (EOL === '\n') {
      return;
    }

    validOptions.inputPath = path.resolve(__dirname, '../../fixtures/file-info/test_crlf.js');
    validOptions.outputPath = path.resolve(__dirname, '../../fixtures/file-info/test_lf.js');
    let fileInfo = new FileInfo(validOptions);

    return fileInfo.checkForConflict().then(function(type) {
      expect(type).to.equal('identical');
    });
  });
});
