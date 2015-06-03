'use strict';

module.exports = {
    /**
      Returns a relative parent path string using the path provided

      @method getRelativeParentPath
      @param {String} path The path to relatively get to.
      @return {String} the relative path string.
    */
    getRelativeParentPath: function getRelativeParentPath(path, offset) {
      var offsetValue = offset || 0;
      return new Array(path.split('/').length + 1 - offsetValue).join('../');
  },

    /**
      Returns a relative path string using the path provided

      @method getRelativePath
      @param {String} path The path to relatively get to.
      @return {String} the relative path string.
    */
    getRelativePath: function getRelativePath(path, offset) {
      var offsetValue = offset || 0;
      var relativePath = new Array(path.split('/').length - offsetValue).join('../');
      return relativePath || './';
    }
};
