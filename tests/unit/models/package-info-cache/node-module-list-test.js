'use strict';

const expect = require('chai').expect;
const NodeModulesList = require('../../../../lib/models/package-info-cache/node-modules-list');

describe('models/package-info-cache/node-modules-list-test', function() {
  it('correctly constructs', function() {
    expect(new NodeModulesList()).to.be.ok;
    expect(new NodeModulesList('/some/path')).to.be.ok;
  });

  describe('.NULL', function() {
    it('returns a singleton, deeply frozen NodeMoudlesList', function() {
      expect(NodeModulesList.NULL).to.equal(NodeModulesList.NULL);
      expect(NodeModulesList.NULL).to.be.frozen;
      expect(NodeModulesList.NULL.entries).to.be.frozen;
      expect(NodeModulesList.NULL.errors).to.be.frozen;
      expect(NodeModulesList.NULL.errors.errors).to.be.frozen;
    });
  });

  describe('findPackage', function() {
    it('works with no entries', function() {
      let list = new NodeModulesList();
      expect(list.findPackage('omg')).to.eql(null);
    });

    it('supports basic entries (missing, present, scoped)', function() {
      let list = new NodeModulesList();
      let scoped = new NodeModulesList();
      let omg = { name: 'omg' };
      let scopedOmg = { name: 'omg' };
      scoped.addEntry('omg', scopedOmg);

      list.addEntry('omg', omg);
      list.addEntry('@thescope', scoped);

      expect(list.findPackage('omg')).to.eql(omg);
      expect(list.findPackage('nope')).to.eql(null);
      expect(list.findPackage('@thescope/omg')).to.eql(scopedOmg);
      expect(list.findPackage('@thescope/nope')).to.eql(null);
      expect(list.findPackage('@nope/nope')).to.eql(null);
    });
  });
});
