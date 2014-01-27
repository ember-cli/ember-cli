module.exports = {
  dist: {
    options: {
      removeComments: true,
      collapseWhitespace: true
    },
    files: [{
      src: '<%= outputPath %>/index.html',
      dest: '<%= outputPath %>/index.html'
    }]
  }
};
