'use strict';

let validProjectName = require('../../../lib/utilities/valid-project-name');
let expect = require('chai').expect;

describe('validate project name', function() {
  it('invalidates nonconformant project name', function() {
    let nonConformantName = 'app';
    let validated = validProjectName(nonConformantName);

    expect(validated).to.not.be.ok;
  });


  it('validates conformant project name', function() {
    let conformantName = 'my-app';
    let validated = validProjectName(conformantName);

    expect(validated).to.be.ok;
  });
});
