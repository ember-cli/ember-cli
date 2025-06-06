'use strict';

const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const { DEPRECATIONS } = require('../../../lib/debug');
const emberAppUtils = require('../../../lib/utilities/ember-app-utils');

const contentFor = emberAppUtils.contentFor;
const configReplacePatterns = emberAppUtils.configReplacePatterns;
const normalizeUrl = emberAppUtils.normalizeUrl;
const convertObjectToString = emberAppUtils.convertObjectToString;

describe('ember-app-utils', function () {
  describe(`rootURL`, function () {
    it('`rootURL` regex accepts space-padded padded variation', function () {
      const regex = configReplacePatterns()[0].match;
      const variations = ['{{rootURL}}', '{{ rootURL }}', 'foo'];
      const results = [];

      variations.forEach((variation) => {
        const match = variation.match(regex);

        if (match !== null) {
          results.push(match[0]);
        }
      });

      variations.pop();
      expect(results).to.deep.equal(variations);
    });
  });

  describe(`EMBER_ENV`, function () {
    it('`EMBER_ENV` regex accepts space-padded padded variation', function () {
      const regex = configReplacePatterns()[1].match;
      const variations = ['{{EMBER_ENV}}', '{{ EMBER_ENV }}', 'foo'];
      const results = [];

      variations.forEach((variation) => {
        const match = variation.match(regex);

        if (match !== null) {
          results.push(match[0]);
        }
      });

      variations.pop();
      expect(results).to.deep.equal(variations);
    });
  });

  describe(`MODULE_PREFIX`, function () {
    it('`MODULE_PREFIX` regex accepts space-padded padded variation', function () {
      const regex = configReplacePatterns()[3].match;
      const variations = ['{{MODULE_PREFIX}}', '{{ MODULE_PREFIX }}', 'foo'];
      const results = [];

      variations.forEach((variation) => {
        const match = variation.match(regex);

        if (match !== null) {
          results.push(match[0]);
        }
      });

      variations.pop();
      expect(results).to.deep.equal(variations);
    });
  });

  describe(`contentFor`, function () {
    let config = {
      modulePrefix: 'cool-foo',
    };

    let defaultMatch = "{{content-for 'head'}}";
    let escapedConfig = encodeURIComponent(JSON.stringify(config));
    let defaultOptions = {
      storeConfigInMeta: true,
      autoRun: true,
      addons: [],
    };

    it('`content-for` regex returns all matches presents in a same line', function () {
      const contentForRegex = configReplacePatterns(defaultOptions)[2].match;
      const content = "{{content-for 'foo'}} {{content-for 'bar'}}";
      const results = [];
      let match;

      while ((match = contentForRegex.exec(content)) !== null) {
        results.push(match);
      }

      expect(results).to.deep.equal([
        ["{{content-for 'foo'}}", 'foo'],
        ["{{content-for 'bar'}}", 'bar'],
      ]);
    });

    it('returns an empty string if invalid type is specified', function () {
      expect(contentFor(config, defaultMatch, 'foo', defaultOptions)).to.equal('');
      expect(contentFor(config, defaultMatch, 'body', defaultOptions)).to.equal('');
      expect(contentFor(config, defaultMatch, 'blah', defaultOptions)).to.equal('');
    });

    describe('"head"', function () {
      it('returns `<meta>` tag by default', function () {
        let actual = contentFor(config, defaultMatch, 'head', defaultOptions);
        let expected = `<meta name="cool-foo/config/environment" content="${escapedConfig}" />`;

        expect(actual, '`<meta>` tag was included by default').to.contain(expected);
      });

      it('handles multibyte characters in `<meta>` tag', function () {
        let configWithMultibyteChars = { modulePrefix: 'cool-å' };
        let actual = contentFor(configWithMultibyteChars, defaultMatch, 'head', defaultOptions);
        let escapedConfig = encodeURIComponent(JSON.stringify(configWithMultibyteChars));
        let expected = `<meta name="cool-å/config/environment" content="${escapedConfig}" />`;

        expect(actual, '`<meta>` tag was included with multibyte characters').to.contain(expected);
      });

      it('omits `<meta>` tag if `storeConfigInMeta` is false', function () {
        let options = Object.assign({}, defaultOptions, { storeConfigInMeta: false });

        let output = contentFor(config, defaultMatch, 'head', options);
        let expected = `<meta name="cool-foo/config/environment" content="${escapedConfig}" />`;

        expect(output, '`<meta>` tag was not included').not.to.contain(expected);
      });
    });

    describe('"config-module"', function () {
      it('returns `<meta>` tag gathering snippet by default', function () {
        let metaSnippetPath = path.join(__dirname, '..', '..', '..', 'lib', 'broccoli', 'app-config-from-meta.js');
        let expected = fs.readFileSync(metaSnippetPath, { encoding: 'utf8' });

        let output = contentFor(config, defaultMatch, 'config-module', defaultOptions);

        expect(output, 'includes `<meta>` tag snippet').to.contain(expected);
      });

      it('returns "raw" config if `storeConfigInMeta` is false', function () {
        let options = Object.assign({}, defaultOptions, { storeConfigInMeta: false });
        let expected = JSON.stringify(config);
        let output = contentFor(config, defaultMatch, 'config-module', options);

        expect(output, 'includes "raw" config').to.contain(expected);
      });
    });

    describe('"app-boot"', function () {
      it('returns application bootstrap snippet by default', function () {
        let output = contentFor(config, defaultMatch, 'app-boot', defaultOptions);

        expect(output, 'includes application bootstrap snippet').to.contain(
          'require("cool-foo/app")["default"].create({});'
        );
      });

      it('omits application bootstrap snippet if `autoRun` is false', function () {
        let options = Object.assign({}, defaultOptions, { autoRun: false });
        let output = contentFor(config, defaultMatch, 'app-boot', options);

        expect(output, 'includes application bootstrap snippet').to.equal('');
      });
    });

    describe('"test-body-footer"', function () {
      it('returns `<script> tag with a failed test load assertion`', function () {
        let output = contentFor(config, defaultMatch, 'test-body-footer', defaultOptions);

        expect(output, 'includes `<script>` tag').to.equal(
          `<script>
document.addEventListener('DOMContentLoaded', function() {
  if (!EmberENV.TESTS_FILE_LOADED) {
    throw new Error('The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".');
  }
});
</script>`
        );
      });
    });

    describe(`for addons`, function () {
      it('allows later addons to inspect previous content', function () {
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

      it('calls `contentFor` on addons', function () {
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

      for (const deprecatedType of DEPRECATIONS.V1_ADDON_CONTENT_FOR_TYPES.options.meta.types) {
        it(`shows a deprecation warning when using the deprecated \`${deprecatedType}\` \`contentFor\` type`, function () {
          if (DEPRECATIONS.V1_ADDON_CONTENT_FOR_TYPES.isRemoved) {
            this.skip();
          }

          const consoleWarn = console.warn;
          const deprecations = [];

          // TODO: This should be updated once we can register deprecation handlers:
          console.warn = (deprecation) => deprecations.push(deprecation);

          const addons = [
            {
              name: 'foo',
              contentFor(type) {
                if (type === deprecatedType) {
                  return `${deprecatedType}-content`;
                }
              },
            },
            {
              contentFor(type) {
                if (type === 'foo') {
                  return 'foo-content';
                }
              },
            },
          ];

          const options = { ...defaultOptions, addons };

          let content = '';
          content += contentFor(config, defaultMatch, deprecatedType, options);
          content += contentFor(config, defaultMatch, 'foo', options);

          expect(content).to.equal(`${deprecatedType}-contentfoo-content`);
          expect(deprecations.length).to.equal(1);
          expect(deprecations[0]).to.include(
            `Addon \`foo\` is using the deprecated \`${deprecatedType}\` type in its \`contentFor\` method.`
          );

          console.warn = consoleWarn;
        });
      }
    });
  });

  describe(`convertObjectToString`, function () {
    it('transforms config object into a string', function () {
      expect(convertObjectToString({ foobar: 'baz' }), `config was transformed correctly`).to.equal('{"foobar":"baz"}');
    });

    it('returns empty object string for "falsy" values', function () {
      let invalidValues = [null, undefined, 0];

      invalidValues.forEach((value) => {
        expect(convertObjectToString(value), `${value} was transformed correctly`).to.equal('{}');
      });
    });
  });

  describe(`normalizeUrl`, function () {
    it('transforms input values to valid urls', function () {
      expect(normalizeUrl('local/people'), '`local/people` was transformed correctly').to.equal('/local/people/');

      expect(normalizeUrl('people'), '`people` was transformed correctly').to.equal('/people/');

      expect(normalizeUrl('/people'), '`/people` was transformed correctly').to.equal('/people/');

      expect(normalizeUrl('/'), '`/` is transformed correctly').to.equal('/');
    });

    it('returns an empty string for `null`, `undefined` and empty string', function () {
      let invalidUrls = [null, undefined, ''];

      invalidUrls.forEach((url) => {
        expect(normalizeUrl(url), `${url} was transformed correctly`).to.equal('');
      });
    });
  });
});
