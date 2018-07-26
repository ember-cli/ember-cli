'use strict';

const co = require('co');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const Yam = require('yam');
const cliEntry = require('../../../lib/cli');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('.ember-cli environment options', function() {
  let sampleApp;

  beforeEach(co.wrap(function *() {
    process.env.SHOULDNT_BE_THERE = 'Normal';

    sampleApp = yield createTempDir();
    sampleApp.write({
      '.ember-cli': JSON.stringify({
        environment: {
          'MY_ENV_VARIABLE': 'Yayy',
          'SHOULDNT_BE_THERE': 'Strange',
        },
      }),
    });

    let primaryPath = sampleApp.path();

    yield buildOutput(primaryPath);

    let mockedYam = new Yam('ember-cli', {
      primary: primaryPath,
    });

    cliEntry({
      UI: MockUI,
      Yam: mockedYam,
    });
  }));

  afterEach(co.wrap(function *() {
    delete process.env.MY_ENV_VARIABLE;
    delete process.env.SHOULDNT_BE_THERE;

    yield sampleApp.dispose();
  }));

  it('should assign environment variables in .ember-cli to process.env', function() {
    expect(process.env.MY_ENV_VARIABLE).to.equal('Yayy');
    expect(process.env.SHOULDNT_BE_THERE).to.equal('Normal');
  });
});
