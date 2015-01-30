var eden = require('node-eden');

exports.getRandomMaleFirstName = function () {
  return eden.adam();
};

exports.getRandomFemaleFirstName = function () {
  return eden.eve();
};

exports.getRandomFamilyName = function () {
  var word = eden.word();
  return word.charAt(0).toUpperCase() + word.slice(1);
};
