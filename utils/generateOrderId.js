const { DateTime } = require('luxon');

function alphaEncode(num) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const place1 = [...charset][Math.floor(num / 24)];
  const place0 = [...charset][num % 24];

  return place1 + place0;
}

function generateOrderId() {
  const dateTime = new DateTime('now');

  const seconds = Math.floor(dateTime.toSeconds());
  const milliSeconds = dateTime.toMillis() - seconds * 1000;

  const alpha = alphaEncode(Math.floor(milliSeconds / 2));

  return `${alpha}${seconds}`;
}

module.exports = generateOrderId;
