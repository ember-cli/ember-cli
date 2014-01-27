var grunt = require('grunt');

module.exports = {
  options: {
    templateBasePath: /app\//,
    templateFileExtensions: /\.(hbs|hjs|handlebars)/,
    templateRegistration: function(name, template) {
      return grunt.config.process("define('<%= package.namespace %>/") + name + "', ['exports'], function(__exports__){ __exports__['default'] = " + template + "; });";
    }
  },
  debug: {
    options: {
      precompile: false
    },
    src: "app/**/*.{hbs,hjs,handlebars}",
    dest: "tmp/result/assets/templates.js"
  },
  dist: {
    src: "<%= emberTemplates.debug.src %>",
    dest: "<%= emberTemplates.debug.dest %>"
  }
};
