'use strict';

const expect = require('chai').expect;
const path = require('path');
const discoverYarn = require('../../../lib/utilities/discover-yarn');

describe('discover-yarn', function() {
  let fixtureDirectory = path.resolve(__dirname, '../../fixtures/discover-yarn');

  const tests = [
    {
      baseDir: path.join(fixtureDirectory, 'normal-yarn-project'),
      expectedResult: true,
    },
    {
      baseDir: path.join(fixtureDirectory, 'not-yarn'),
      expectedResult: false,
    },
    {
      baseDir: path.join(fixtureDirectory, 'yarn-workspace'),
      expectedResult: true,
    },
    {
      baseDir: path.join(fixtureDirectory, 'yarn-workspace', 'package-a'),
      expectedResult: true,
    },
    {
      baseDir: path.join(fixtureDirectory, 'yarn-workspace', 'package-b'),
      expectedResult: true,
    },
    {
      baseDir: path.join(fixtureDirectory, 'yarn-workspace', 'not-in-workspace'),
      expectedResult: false,
    },
    {
      baseDir: path.join(fixtureDirectory, 'yarn-workspace-no-lockfile'),
      expectedResult: true,
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const baseDir = tests[i].baseDir;
    const expectedResult = tests[i].expectedResult;

    it(`${baseDir} is${expectedResult ? '' : ' not'} using yarn`, function() {
      expect(discoverYarn(baseDir)).to.equal(expectedResult);
    });
  }
});
