'use strict';

var denodeify = require('rsvp').denodeify;
var fs = require('fs');
var symlink = denodeify(fs.symlink);
var path = require('path');
var ncp = require('ncp');
var rimraf = require('rimraf');

function BroccoliChange(dir) {
  this.dir = dir;
}

module.exports = BroccoliChange;

function trySymlink(src, dest) {
  return symlink(src, dest).catch(function(err) {
    if(err.code === 'EEXIST') {
      rimraf.sync(dest);
      return symlink(src, dest);
    }

    throw err;
  });
}

BroccoliChange.prototype.symlinkTo = function(dest) {
  var src = this.dir;
  return trySymlink(path.resolve(src), dest);
};

BroccoliChange.prototype.copyTo = function(dest) {
  var src = this.dir;
  return ncp(src, dest, {
    clobber: true,
    stopOnErr: true
  });
};
