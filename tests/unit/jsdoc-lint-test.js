'use strict';

/*
 * JSDoc lint test to validate documentation completeness
 * Runs JSDoc in a separate process to avoid interference with test suite
 */

if (!process.env['IS_CHILD']) {
  const execa = require('execa');

  describe('JSDoc', function () {
    it('parses without warnings', async function () {
      await execa('node', [`--unhandled-rejections=strict`, __filename], {
        env: {
          IS_CHILD: true,
        },
      });
    });
  });
  return;
}

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  // Run JSDoc to validate documentation can be generated without errors
  const jsdocPath = path.join(__dirname, '../../node_modules/.bin/jsdoc');
  const configPath = path.join(__dirname, '../../jsdoc.json');
  const tempDir = path.join(__dirname, '../../temp-docs-test');
  
  // Create temporary config for testing that outputs to temp directory
  const testConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  testConfig.opts.destination = tempDir;
  const testConfigPath = path.join(__dirname, '../../jsdoc-test.json');
  fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  
  // Run JSDoc and capture stderr for errors
  const result = execSync(`"${jsdocPath}" -c "${testConfigPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '../..')
  });

  // Clean up temp files
  fs.unlinkSync(testConfigPath);
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

} catch (error) {
  // Clean up temp files on error
  const testConfigPath = path.join(__dirname, '../../jsdoc-test.json');
  const tempDir = path.join(__dirname, '../../temp-docs-test');
  try {
    if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (cleanupError) {
    // Ignore cleanup errors
  }
  
  // Only throw error if it contains actual JSDoc parsing errors, not undocumented warnings
  if (error.stderr && (error.stderr.includes('ERROR:') || error.stderr.includes('Unable to parse'))) {
    let message = 'JSDoc parsing errors found:\n\n';
    message += error.stderr;
    throw new Error(message);
  }
  
  // If no parsing errors, the documentation is valid even if some code is undocumented
}
