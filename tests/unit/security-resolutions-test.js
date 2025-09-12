'use strict';

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Security Resolutions', function () {
  let packageJson;

  beforeEach(function () {
    const packagePath = path.join(__dirname, '../../package.json');
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  });

  it('package.json contains pnpm overrides', function () {
    expect(packageJson.pnpm).to.exist;
    expect(packageJson.pnpm.overrides).to.exist;
  });

  it('overrides braces for CVE-2024-4068 ReDoS vulnerability', function () {
    expect(packageJson.pnpm.overrides.braces).to.exist;
    expect(packageJson.pnpm.overrides.braces).to.equal('>=3.0.3');
  });

  it('overrides ansi-html for CVE-2021-23424 XSS vulnerability', function () {
    expect(packageJson.pnpm.overrides['ansi-html']).to.exist;
    expect(packageJson.pnpm.overrides['ansi-html']).to.equal('>=0.0.9');
  });

  it('DEPENDENCY_UPDATES.md documents the security resolutions', function () {
    const docPath = path.join(__dirname, '../../DEPENDENCY_UPDATES.md');
    expect(fs.existsSync(docPath)).to.be.true;
    
    const content = fs.readFileSync(docPath, 'utf8');
    expect(content).to.include('braces');
    expect(content).to.include('ansi-html');
    expect(content).to.include('CVE-2024-4068');
    expect(content).to.include('CVE-2021-23424');
  });

  it('JSDoc dependency is updated from YUIDoc', function () {
    expect(packageJson.devDependencies.jsdoc).to.exist;
    expect(packageJson.devDependencies.yuidocjs).to.not.exist;
    
    // Ensure JSDoc version is reasonably recent
    const jsdocVersion = packageJson.devDependencies.jsdoc;
    expect(jsdocVersion).to.match(/^[\^~]?4\./); // Should be JSDoc 4.x
  });

  it('docs script uses JSDoc instead of YUIDoc', function () {
    expect(packageJson.scripts.docs).to.exist;
    expect(packageJson.scripts.docs).to.include('jsdoc');
    expect(packageJson.scripts.docs).to.not.include('yuidoc');
  });

  it('git-repo-info dependency exists for version utils', function () {
    expect(packageJson.dependencies['git-repo-info'] || packageJson.devDependencies['git-repo-info']).to.exist;
  });
});
