'use strict';

function supportEmoji() {
  const hasEmojiTurnedOff = process.argv.indexOf('--no-emoji') > -1;
  return process.stdout.isTTY && process.platform !== 'win32' && !hasEmojiTurnedOff;
}

const areEmojiSupported = supportEmoji();

module.exports = function prependEmoji(emoji, msg) {
  return areEmojiSupported ? `${emoji}  ${msg}` : msg;
};
