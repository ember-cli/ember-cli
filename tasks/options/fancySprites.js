var path = require('path');

module.exports = {
  create: {
    destStyles: 'tmp/sprites',
    destSpriteSheets: 'tmp/result/assets/sprites',
    files: [{
        src: ['app/sprites/**/*.{png,jpg,jpeg}', '!app/sprites/**/*@2x.{png,jpg,jpeg}'],
        spriteSheetName: '1x',
        spriteName: function(name) {
          return path.basename(name, path.extname(name));
        }
      }, {
        src: 'app/sprites/**/*@2x.{png,jpg,jpeg}',
        spriteSheetName: '2x',
        spriteName: function(name) {
          return path.basename(name, path.extname(name)).replace(/@2x/, '');
        }
      }
    ]
  }
};