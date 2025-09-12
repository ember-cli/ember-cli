'use strict';

const { expect } = require('chai');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('Documentation Generation Integration', function () {
  let tempDocsDir;
  let testConfigPath;

  beforeEach(function () {
    tempDocsDir = path.join(__dirname, '../tmp/docs-integration-test');
    testConfigPath = path.join(__dirname, '../tmp/jsdoc-integration-test.json');
    
    // Ensure tmp directory exists
    fs.ensureDirSync(path.dirname(tempDocsDir));
    fs.ensureDirSync(path.dirname(testConfigPath));
    
    // Clean up any existing temp directories
    if (fs.existsSync(tempDocsDir)) {
      fs.removeSync(tempDocsDir);
    }
    if (fs.existsSync(testConfigPath)) {
      fs.removeSync(testConfigPath);
    }
  });

  afterEach(function () {
    // Clean up temp files
    if (fs.existsSync(tempDocsDir)) {
      fs.removeSync(tempDocsDir);
    }
    if (fs.existsSync(testConfigPath)) {
      fs.removeSync(testConfigPath);
    }
  });

  it('generates documentation without errors', function () {
    this.timeout(30000); // JSDoc can take a while
    
    // Create test config that outputs to temp directory
    const mainConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../jsdoc.json'), 'utf8'));
    const testConfig = Object.assign({}, mainConfig, {
      opts: Object.assign({}, mainConfig.opts, {
        destination: tempDocsDir
      })
    });
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    // Run JSDoc
    const jsdocPath = path.join(__dirname, '../../node_modules/.bin/jsdoc');
    
    expect(() => {
      execSync(`"${jsdocPath}" -c "${testConfigPath}"`, {
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..')
      });
    }).to.not.throw();
    
    // Verify documentation was generated
    expect(fs.existsSync(tempDocsDir)).to.be.true;
    expect(fs.existsSync(path.join(tempDocsDir, 'index.html'))).to.be.true;
  });

  it('includes version information in generated docs', function () {
    this.timeout(30000);
    
    // Create test config
    const mainConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../jsdoc.json'), 'utf8'));
    const testConfig = Object.assign({}, mainConfig, {
      opts: Object.assign({}, mainConfig.opts, {
        destination: tempDocsDir
      })
    });
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    // Run JSDoc
    const jsdocPath = path.join(__dirname, '../../node_modules/.bin/jsdoc');
    execSync(`"${jsdocPath}" -c "${testConfigPath}"`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '../..')
    });
    
    // Check that index.html contains version info
    const indexPath = path.join(tempDocsDir, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Should contain a version number (not the {{version}} placeholder)
    expect(indexContent).to.match(/\d+\.\d+\.\d+/);
    expect(indexContent).to.not.include('{{version}}');
  });

  it('processes all expected source files', function () {
    this.timeout(30000);
    
    // Create test config
    const mainConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../jsdoc.json'), 'utf8'));
    const testConfig = Object.assign({}, mainConfig, {
      opts: Object.assign({}, mainConfig.opts, {
        destination: tempDocsDir
      })
    });
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    // Run JSDoc
    const jsdocPath = path.join(__dirname, '../../node_modules/.bin/jsdoc');
    execSync(`"${jsdocPath}" -c "${testConfigPath}"`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '../..')
    });
    
    // Check for some key documentation files that should be generated
    const expectedModules = [
      'module-ember-cli.html',
      'module-ember-cli-Project.html',
      'module-ember-cli-EmberApp.html',
      'module-ember-cli-Blueprint.html'
    ];
    
    expectedModules.forEach(moduleName => {
      const modulePath = path.join(tempDocsDir, moduleName);
      expect(fs.existsSync(modulePath), `Expected ${moduleName} to be generated`).to.be.true;
    });
  });
});
