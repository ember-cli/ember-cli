module.exports = {
  compile: {
    files: {
      "tmp/result/assets/templates.js": ['app/templates/**/*.{emblem,hbs,hjs,handlebars}']
    },
    options: {
      root: 'app/templates/',
      dependencies: {
        jquery: 'vendor/jquery/jquery.js',
        ember: 'vendor/ember/ember.js',
        handlebars: 'vendor/handlebars/handlebars.js',
        emblem: 'vendor/emblem.js/emblem.js'
      }
    }
  }
};