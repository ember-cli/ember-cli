'use strict';

const { expect } = require('chai');
const plugin = require('../../../docs/jsdoc-version-plugin');
const versionUtils = require('../../../lib/utilities/version-utils');

describe('JSDoc Version Plugin', function () {
  describe('beforeParse handler', function () {
    it('replaces {{version}} placeholder with actual version', function () {
      const mockEvent = {
        source: 'This is version {{version}} of the docs'
      };
      
      plugin.handlers.beforeParse(mockEvent);
      
      expect(mockEvent.source).to.match(/This is version \d+\.\d+\.\d+/);
      expect(mockEvent.source).to.not.include('{{version}}');
    });

    it('replaces multiple {{version}} placeholders', function () {
      const mockEvent = {
        source: 'Version {{version}} includes {{version}} features'
      };
      
      plugin.handlers.beforeParse(mockEvent);
      
      const versionMatches = mockEvent.source.match(/\d+\.\d+\.\d+/g);
      expect(versionMatches).to.have.length(2);
      expect(mockEvent.source).to.not.include('{{version}}');
    });

    it('uses the same version as versionUtils.emberCLIVersion()', function () {
      const mockEvent = {
        source: 'Version: {{version}}'
      };
      
      plugin.handlers.beforeParse(mockEvent);
      
      const expectedVersion = versionUtils.emberCLIVersion();
      expect(mockEvent.source).to.equal(`Version: ${expectedVersion}`);
    });

    it('handles source with no version placeholders', function () {
      const originalSource = 'This has no version placeholders';
      const mockEvent = {
        source: originalSource
      };
      
      plugin.handlers.beforeParse(mockEvent);
      
      expect(mockEvent.source).to.equal(originalSource);
    });
  });

  describe('defineTags', function () {
    let mockDictionary;

    beforeEach(function () {
      mockDictionary = {
        tags: {},
        defineTag: function(name, config) {
          this.tags[name] = config;
        }
      };
    });

    it('defines @public tag', function () {
      plugin.defineTags(mockDictionary);
      
      expect(mockDictionary.tags.public).to.exist;
      expect(mockDictionary.tags.public.mustHaveValue).to.equal(false);
      expect(mockDictionary.tags.public.onTagged).to.be.a('function');
    });

    it('defines @private tag', function () {
      plugin.defineTags(mockDictionary);
      
      expect(mockDictionary.tags.private).to.exist;
      expect(mockDictionary.tags.private.mustHaveValue).to.equal(false);
      expect(mockDictionary.tags.private.onTagged).to.be.a('function');
    });

    it('@public tag sets access to public', function () {
      plugin.defineTags(mockDictionary);
      
      const mockDoclet = {};
      const mockTag = {};
      
      mockDictionary.tags.public.onTagged(mockDoclet, mockTag);
      
      expect(mockDoclet.access).to.equal('public');
    });

    it('@private tag sets access to private', function () {
      plugin.defineTags(mockDictionary);
      
      const mockDoclet = {};
      const mockTag = {};
      
      mockDictionary.tags.private.onTagged(mockDoclet, mockTag);
      
      expect(mockDoclet.access).to.equal('private');
    });
  });
});
