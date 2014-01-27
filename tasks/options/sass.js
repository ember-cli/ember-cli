module.exports = {
  compile: {
    files: [{
      expand: true,
      cwd: 'app/styles',
      src: ['**/*.{scss,sass}', '!**/_*.{scss,sass}'],
      dest: 'tmp/result/assets/',
      ext: '.css'
    }]
  }
};
