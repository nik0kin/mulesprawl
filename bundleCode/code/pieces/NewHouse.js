var _ = require('lodash');

var addNewFarmer = require('./NewFarmer'),
  mapUtils = require('../mapUtils'),
  randomUtils = require('mule-utils/randomUtils'),
  randomNames = require('../randomNames');

var addNewHouse = function (M, params) {
  M.log('new House, ' + params.playerRel + ' at ' + (params.where.x) + ',' + (params.where.y));

  var familyName;

  if (params.freeFamily) {
    familyName = randomNames.getRandomFamilyName();
    // husband
    addNewFarmer(M, {
      playerRel: params.playerRel,
      where: params.where,
      sex: 'male',
      age: 17,
      birthMonth: randomUtils.getRandomInt(1,12),
      married: 'married',
      familyName: familyName,
      homeId: mapUtils.XYToLocationId(params.where)
    });
    // wife
    addNewFarmer(M, {
      playerRel: params.playerRel,
      where: params.where,
      sex: 'female',
      age: 15,
      birthMonth: randomUtils.getRandomInt(1,12),
      married: 'married',
      familyName: familyName,
      homeId: mapUtils.XYToLocationId(params.where)
    });
  }

  var newPiece = {
    class: 'House',
    attributes: {
      family: familyName || params.familyName
    },
    ownerId: params.playerRel,
    locationId: mapUtils.XYToLocationId(params.where)
  };
  M.addPiece(newPiece);
};

module.exports = addNewHouse;
