'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;

const emberAppUtils = require('../../../lib/utilities/ember-app-utils');

const contentFor = emberAppUtils.contentFor;
const configReplacePatterns = emberAppUtils.configReplacePatterns;
const normalizeUrl = emberAppUtils.normalizeUrl;
const calculateBaseTag = emberAppUtils.calculateBaseTag;
const convertObjectToString = emberAppUtils.convertObjectToString;

describe('ember-app-utils', function() {
  describe(`contentFor`, function() {
    let config = {
      modulePrefix: 'cool-foo',
    };

    let defaultMatch = "{{content-for 'head'}}";
    let escapedConfig = encodeURIComponent(JSON.stringify(config));
    let defaultOptions = {
      storeConfigInMeta: true,
      autoRun: true,
      addons: [],
      isModuleUnification: false,
    };

    it('`content-for` regex returns all matches presents in a same line', function() {
      const contentForRegex = configReplacePatterns(defaultOptions)[2].match;
      const content = "{{content-for 'foo'}} {{content-for 'bar'}}";
      const results = [];
      let match;

      while ((match = contentForRegex.exec(content)) !== null) {
        results.push(match);
      }

      expect(results).to.deep.equal([["{{content-for 'foo'}}", 'foo'], ["{{content-for 'bar'}}", 'bar']]);
    });

    it('returns an empty string if invalid type is specified', function() {
      expect(contentFor(config, defaultMatch, 'foo', defaultOptions)).to.equal('');
      expect(contentFor(config, defaultMatch, 'body', defaultOptions)).to.equal('');
      expect(contentFor(config, defaultMatch, 'blah', defaultOptions)).to.equal('');
    });

    describe('"head"', function() {
      it('returns `<meta>` tag by default', function() {
        let actual = contentFor(config, defaultMatch, 'head', defaultOptions);
        let expected = `<meta name="cool-foo/config/environment" content="${escapedConfig}" />`;

        expect(actual, '`<meta>` tag was included by default').to.contain(expected);
      });

      it('handles multibyte characters in `<meta>` tag', function() {
        let configWithMultibyteChars = { modulePrefix: 'cool-å' };
        let actual = contentFor(configWithMultibyteChars, defaultMatch, 'head', defaultOptions);
        let escapedConfig = encodeURIComponent(JSON.stringify(configWithMultibyteChars));
        let expected = `<meta name="cool-å/config/environment" content="${escapedConfig}" />`;

        expect(actual, '`<meta>` tag was included with multibyte characters').to.contain(expected);
      });

      it('omits `<meta>` tag if `storeConfigInMeta` is false', function() {
        let options = Object.assign({}, defaultOptions, { storeConfigInMeta: false });

        let output = contentFor(config, defaultMatch, 'head', options);
        let expected = `<meta name="cool-foo/config/environment" content="${escapedConfig}" />`;

        expect(output, '`<meta>` tag was not included').not.to.contain(expected);
      });

      it('returns `<base>` tag if `locationType` is "auto"', function() {
        config.locationType = 'auto';
        config.baseURL = '/';

        let expected = '<base href="/" />';
        let output = contentFor(config, defaultMatch, 'head', defaultOptions);

        expect(output, '`<base>` tag was included').to.contain(expected);
      });

      // this is required by testem
      it('returns `<base>` tag if `locationType` is "none"', function() {
        config.locationType = 'none';
        config.baseURL = '/';

        let output = contentFor(config, defaultMatch, 'head', defaultOptions);
        let expected = '<base href="/" />';

        expect(output, '`<base>` tag was included').to.contain(expected);
      });

      it('omits `<base>` tag if `locationType` is "hash"', function() {
        config.locationType = 'hash';
        config.baseURL = '/foo/bar';

        let expected = '<base href="/foo/bar/" />';
        let output = contentFor(config, defaultMatch, 'head', defaultOptions);

        expect(output, '`<base>` tag was not included').to.not.contain(expected);
      });

      it('omits `<base>` tag if `baseURL` is `undefined`', function() {
        let expected = '<base href=';
        let output = contentFor(config, defaultMatch, 'head', defaultOptions);

        expect(output, '`<base>` tag was not included').to.not.contain(expected);
      });
    });

    describe('"config-module"', function() {
      it('returns `<meta>` tag gathering snippet by default', function() {
        let metaSnippetPath = path.join(__dirname, '..', '..', '..', 'lib', 'broccoli', 'app-config-from-meta.js');
        let expected = fs.readFileSync(metaSnippetPath, { encoding: 'utf8' });

        let output = contentFor(config, defaultMatch, 'config-module', defaultOptions);

        expect(output, 'includes `<meta>` tag snippet').to.contain(expected);
      });

      it('returns "raw" config if `storeConfigInMeta` is false', function() {
        let options = Object.assign({}, defaultOptions, { storeConfigInMeta: false });
        let expected = JSON.stringify(config);
        let output = contentFor(config, defaultMatch, 'config-module', options);

        expect(output, 'includes "raw" config').to.contain(expected);
      });
    });

    describe('"app-boot"', function() {
      it('returns application bootstrap snippet by default', function() {
        let output = contentFor(config, defaultMatch, 'app-boot', defaultOptions);

        expect(output, 'includes applicaton bootstrap snippet').to.contain(
          'require("cool-foo/app")["default"].create({});'
        );
      });

      it('returns application bootstrap snippet with MU module name if `isModuleUnification` is true', function() {
        let options = Object.assign({}, defaultOptions, { isModuleUnification: true });
        let output = contentFor(config, defaultMatch, 'app-boot', options);

        expect(output, 'includes applicaton bootstrap snippet').to.contain(
          'require("cool-foo/src/main")["default"].create({});'
        );
      });

      it('omits application bootstrap snippet if `autoRun` is false', function() {
        let options = Object.assign({}, defaultOptions, { autoRun: false });
        let output = contentFor(config, defaultMatch, 'app-boot', options);

        expect(output, 'includes applicaton bootstrap snippet').to.equal('');
      });
    });

    describe('"test-body-footer"', function() {
      it('returns `<script> tag with a failed test load assertion`', function() {
        let output = contentFor(config, defaultMatch, 'test-body-footer', defaultOptions);

        expect(output, 'includes `<script>` tag').to.equal(
          `<script>Ember.assert('The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".', EmberENV.TESTS_FILE_LOADED);</script>`
        );
      });
    });

    describe(`for addons`, function() {
      it('allows later addons to inspect previous content', function() {
        let calledContent;
        let addons = [
          {
            contentFor() {
              return 'zero';
            },
          },
          {
            contentFor() {
              return 'one';
            },
          },
          {
            contentFor(type, config, content) {
              calledContent = content.slice();
              content.pop();

              return 'two';
            },
          },
        ];

        let options = Object.assign({}, defaultOptions, { addons });
        let output = contentFor(config, defaultMatch, 'foo', options);

        expect(calledContent).to.deep.equal(['zero', 'one']);
        expect(output).to.equal('zero\ntwo');
      });

      it('calls `contentFor` on addons', function() {
        let addons = [
          {
            contentFor() {
              return 'blammo';
            },
          },
          {
            contentFor() {
              return 'blahzorz';
            },
          },
        ];

        let options = Object.assign({}, defaultOptions, { addons });
        let output = contentFor(config, defaultMatch, 'foo', options);

        expect(output).to.equal('blammo\nblahzorz');
      });
    });
  });

  describe(`calculateBaseTag`, function() {
    ['auto', 'history'].forEach(locationType => {
      it(`generates a base tag correctly for location: ${locationType}`, function() {
        expect(calculateBaseTag('/', locationType), `base tag was generated correctly`).to.equal('<base href="/" />');
      });
    });

    it('returns an empty string if location is "hash"', function() {
      expect(calculateBaseTag('/', 'hash'), `base tag was generated correctly`).to.equal('');
    });

    [null, undefined, ''].forEach(url => {
      it(`returns an empty string if the url is ${url === '' ? 'empty string' : url}`, function() {
        expect(calculateBaseTag(url, 'hash')).to.equal('');
      });
    });
  });

  describe(`convertObjectToString`, function() {
    it('transforms config object into a string', function() {
      expect(convertObjectToString({ foobar: 'baz' }), `config was transformed correctly`).to.equal('{"foobar":"baz"}');
    });

    it('returns empty object string for "falsy" values', function() {
      let invalidValues = [null, undefined, 0];

      invalidValues.forEach(value => {
        expect(convertObjectToString(value), `${value} was transformed correctly`).to.equal('{}');
      });
    });
  });

  describe(`normalizeUrl`, function() {
    it('transforms input values to valid urls', function() {
      expect(normalizeUrl('local/people'), '`local/people` was transformed correctly').to.equal('/local/people/');

      expect(normalizeUrl('people'), '`people` was transformed correctly').to.equal('/people/');

      expect(normalizeUrl('/people'), '`/people` was transformed correctly').to.equal('/people/');

      expect(normalizeUrl('/'), '`/` is transformed correctly').to.equal('/');
    });

    it('returns an empty string for `null`, `undefined` and empty string', function() {
      let invalidUrls = [null, undefined, ''];

      invalidUrls.forEach(url => {
        expect(normalizeUrl(url), `${url} was transformed correctly`).to.equal('');
      });
    });
  });
});
