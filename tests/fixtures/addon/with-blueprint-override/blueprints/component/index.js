const { isExperimentEnabled } = require('../../../../lib/experiments');
const path = require('path');


module.exports = {

  filesPath: function() {
    let filesDirectory = 'files';

    if (isExperimentEnabled('MODULE_UNIFICATION')) {
      filesDirectory = 'module-unification-files';
    }

    return path.join(this.path, filesDirectory);
  },

  fileMapTokens: function() {
    if (isExperimentEnabled('MODULE_UNIFICATION')) {
      return {
        __root__(options) {
          return 'src';
        },
        __path__(options) {
          return path.join('ui', 'components', 'new-path', options.dasherizedModuleName);
        },
      };
    } else {
      return {
        __path__: function(options) {
          return path.join('components', 'new-path');
        },
      };
    }
  },

  locals(options) {
    return {
      importTemplate: '',
      contents: '',
      path: ''
    };
  }
};
