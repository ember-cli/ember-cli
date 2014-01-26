var grunt = require('grunt'),
    _ = grunt.util._,
    Helpers = {};

// List of package requisits for tasks
// Notated in conjunctive normal form (CNF)
// e.g. ['a', ['b', 'alternative-to-b']]
var taskRequirements = {
  coffee: ['grunt-contrib-coffee'],
  compass: ['grunt-contrib-compass'],
  sass: [['grunt-sass', 'grunt-contrib-sass']],
  less: ['grunt-contrib-less'],
  stylus: ['grunt-contrib-stylus'],
  emberTemplates: ['grunt-ember-templates'],
  emblem: ['grunt-emblem'],
  emberscript: ['grunt-ember-script'],
  imagemin: ['grunt-contrib-imagemin'],
  htmlmin: ['grunt-contrib-htmlmin'],
  fancySprites: ['grunt-fancy-sprites'],
  autoprefixer: ['grunt-autoprefixer'],
  rev: ['grunt-rev']
};

// Task fallbacks
// e.g. 'a': ['fallback-a-step-1', 'fallback-a-step-2']
var taskFallbacks = {
  'imagemin': 'copy:imageminFallback'
};


Helpers.filterAvailableTasks = function(tasks){
  tasks = tasks.map(function(taskName) {
    // Maps to task name or fallback if task is unavailable

    var baseName = taskName.split(':')[0]; // e.g. 'coffee' for 'coffee:compile'
    var reqs = taskRequirements[baseName];
    var isAvailable = Helpers.isPackageAvailable(reqs);
    return isAvailable ? taskName : taskFallbacks[taskName]; 
  });

  return _.flatten(_.compact(tasks)); // Remove undefined's and flatten it
};

Helpers.isPackageAvailable = function(pkgNames) {
  if (!pkgNames) return true;  // packages are assumed to exist

  if (!_.isArray(pkgNames)) { pkgNames = [pkgNames]; }

  return _.every(pkgNames, function(pkgNames) {
    if (!_.isArray(pkgNames)) { pkgNames = [pkgNames]; }

    return _.any(pkgNames, function(pkgName) {
      return !!Helpers.pkg.devDependencies[pkgName];
    });
  });
};

module.exports = Helpers;
