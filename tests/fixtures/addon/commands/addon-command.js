function Addon() { return this; }

Addon.prototype.includedCommands = function() {
  return {
    'AddonCommand': {
      name: 'addon-command',
      aliases: ['ac']
    }
  };
}

module.exports = Addon;
