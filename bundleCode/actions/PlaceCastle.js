
var _ = require('lodash'),
  Q = require('q');

var randomUtils = require('mule-utils/randomUtils'),
  addNewHouse = require('../code/pieces/NewHouse'),
  XYToLocationId = require('../code/mapUtils').XYToLocationId;

var HOUSES_PER_CASTLE_PLACE = 6;

var castleSpots = [
  {x: 0, y: 0}, {x: 1, y: 0},
  {x: 0, y: 1}, {x: 1, y: 1}
];

var houseSpots = [
  {x: -1, y: 0}, {x: -1, y: 1},
  {x: 0, y: -1}, {x: 1, y: -1},
  {x: 2, y: 0}, {x: 2, y: 1},
  {x: 0, y: 2}, {x: 1, y: 2}
];

/**
 * params should contain:
 *   - playerRel
 *   - where: {x: int, y: int}
 */

exports.validateQ = function (M, actionOwnerRel, params) {
  var space = M.getSpace(XYToLocationId(params.where));

  if (!space) {
    throw 'INVALID SPACE';
  }

  if (M.getPlayerVariable(actionOwnerRel, 'castlePlaced')) {
    throw 'CASTLE already PLACED';
  }

  params.where.x = parseInt(params.where.x);
  params.where.y = parseInt(params.where.y);

  //TODO check if there isn't any other buildings there

  //check if the terrain is grass/road

  var validLocation = true;
  _.each(castleSpots, function (value) {
    var location = (params.where.x + value.x) + ',' + (params.where.y + value.y);
    var _space = M.getSpace(location);
    M.log(_space);
    if (_space) {
      M.log(_space.attributes.terrainType);
      if (_space.attributes.terrainType !== 'road' && _space.attributes.terrainType !== 'grass') {
        validLocation = false;
      }
    }
  });

  if (!validLocation) {
    throw 'INVALID where LOCATION';
  }
};

exports.doQ = function (M, actionOwnerRel, params) {
  M.log('new Castle, ' + actionOwnerRel + ' at ' + XYToLocationId(params.where));

  var _metadata = {
    newFarms: []
  };

  var newCastle = {
    class: 'Castle',
    attributes: {},
    ownerId: actionOwnerRel,
    locationId: XYToLocationId(params.where)
  };

  var newCastleId = M.addPiece(newCastle);

  //// phantom pieces (for buildings that take up multiple locations) ////

  _.each(castleSpots, function (value, key) {
    if (key === 0) return; //dont make phantom at the real space location

    var newPhantom = {
      class: '_phantom',
      attributes: {'class': 'Castle', 'id': newCastleId},
      ownerId: actionOwnerRel,
      locationId: (params.where.x + value.x) + ',' + (params.where.y + value.y)
    };
    M.addPiece(newPhantom);
  });

  //// starting houses + families ////
  var chosenHouseSpots = randomUtils.pickRandom(houseSpots, HOUSES_PER_CASTLE_PLACE);
  _.each(chosenHouseSpots, function (value, key) {
    var whereXY = {x: (params.where.x + value.x), y: (params.where.y + value.y)};
    addNewHouse(M, {
      playerRel: actionOwnerRel,
      where: whereXY,
      freeFamily: true
    });
    _metadata.newFarms.push(whereXY.x + ',' + whereXY.y);
  });

  M.setPlayerVariable(actionOwnerRel, 'castlePlaced', true);

  return M.persistQ()
    .then(function () {
      //add meta data
      return Q(_metadata);
    });
};
