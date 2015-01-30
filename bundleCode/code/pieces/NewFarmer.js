var _ = require('lodash');

var randomNames = require('../randomNames'),
  XYToLocationId = require('../mapUtils').XYToLocationId;

var addNewFarmer = function (M, params) {
  M.log('new Farmer, ' + params.playerRel + ' at ' + XYToLocationId(params.where));

  var newPiece = {
    class: 'Farmer',
    attributes: {
      age: params.age,
      name: params.sex === 'male' ? randomNames.getRandomMaleFirstName() : randomNames.getRandomFemaleFirstName(),
      familyName: params.familyName,
      sex: params.sex,
      home: params.homeId,
      married: params.married
    },
    ownerId: params.playerRel,
    locationId: XYToLocationId(params.where)
  };

  M.addPiece(newPiece);
};

module.exports = addNewFarmer;
