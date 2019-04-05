'use strict';

const expect = require('chai').expect;
const processTemplate = require('../../../lib/utilities/process-template');

describe('process-template', function() {
  it('successfully transforms a template', function() {
    expect(processTemplate('hello <%= user %>!', { user: 'fred' })).to.be.equal('hello fred!');
    expect(processTemplate('<b><%- value %></b>', { value: '<script>' })).to.be.equal('<b>&lt;script&gt;</b>');
    expect(
      processTemplate('<% users.forEach(function(user) { %><li><%- user %></li><% }); %>', {
        users: ['fred', 'barney'],
      })
    ).to.be.equal('<li>fred</li><li>barney</li>');
  });
});
