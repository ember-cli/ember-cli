module.exports = {
  dist: {
    options: {
      removeComments: true,
      collapseWhitespace: true
    },
    files: [{
      src: 'dist/index.html',
      dest: 'dist/index.html'
    }]
  }
};