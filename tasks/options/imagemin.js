module.exports = {
  dist: {
    options: {
      cache: false
    },
    files: [{
      expand: true,
      cwd: 'tmp/result',
      src: '**/*.{png,gif,jpg,jpeg}',
      dest: 'dist/'
    }]
  }
};
