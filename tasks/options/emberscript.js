// EmberScript compilation. This must be enabled by modification
// of Gruntfile.js.
//
// The `bare` option is used since this file will be transpiled
// anyway. In EmberScript files, you need to escape out for
// some ES6 features like import and export. For example:
//
// `import User from 'appkit/models/user'`
//
// class Post
//   init: (userId) ->
//     @user = User.findById(userId)
//
// `export default Post`
//

module.exports = {
  "test": {
    options: {
      bare: true
    },
    files: [{
      expand: true,
      cwd: 'tests/',
      src: '**/*.em',
      dest: 'tmp/javascript/tests',
      ext: '.js'
    }]
  },
  "app": {
    options: {
      bare: true
    },
    files: [{
      expand: true,
      cwd: 'app/',
      src: '**/*.em',
      dest: 'tmp/javascript/app',
      ext: '.js'
    }]
  }
};