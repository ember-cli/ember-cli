module.exports = {
  compile: {
    files: [{
      expand: true,
      cwd: 'app/styles',
      src: ['**/*.less', '!**/_*.less'],
      dest: 'tmp/result/assets/',
      ext: '.css'
    }]
  }
};
