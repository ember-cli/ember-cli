'use strict';

var fs = require('fs');

module.exports = function () {
  return function(req, res, next) {
    var regex = new RegExp('^/tests');
    if (req.path.match(regex)) {
      var filePath = 'tests/index.html';
      fs.stat(filePath, function() {
        res.sendfile(filePath, function(err) {
          if (err) {
            next();
            return;
          }
        });
      });
    } else {
      next();
    }
  };
};
