var _ = require('lodash'),
  Q = require('q');

var randomUtils = require('mule-utils/randomUtils'),
  actionsUtils = require('mule-utils/actionsUtils');

exports.XYToLocationId = function (obj) {
  return obj.x + ',' + obj.y;
};

exports.locationIdToXY = function (locationId) {
  var loc = locationId.split(',');
  return {x: parseInt(loc[0]), y: parseInt(loc[1])};
};

var nextToSpaces = [
  {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
  {x: -1, y: 0}, {x: 1, y: 0},
  {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1}
];

exports.findNearestAvailableFarmSpace = function (M, locationId) {
  //has to be grass and not have a farm on it
  var loc = exports.locationIdToXY(locationId);

  var locationId,
    boardSize = M.getCustomBoardSettings(),
    found = false,
    i = 1;
  do {
    var possiblities = [];
    _.each(nextToSpaces, function (value, key) {
      var cLoc = {x: loc.x + value.x * i, y: loc.y + value.y * i},
        cLocId = exports.XYToLocationId(cLoc);

      //if not in bounds
      if (cLoc.x < 0 || cLoc.x >= boardSize.width || cLoc.y < 0 || cLoc.y >= boardSize.height ) return;

      //if not grass
      var space = M.getSpace(cLocId);
      M.log(cLocId)
      if (space.attributes.terrainType !== 'grass') return;

      //if buildings there
      var pieces = M.getPieces({spaceId: cLocId});
      if (pieces.length > 0) {
        M.log('PIECESZ' + pieces.length)
        var buildingsPresent = false;
        _.each(pieces, function (piece) {
          if (piece.class === '_phantom' || piece.class === 'Castle' || piece.class === 'House')
            buildingsPresent = true;
        });
        if (buildingsPresent) {
          M.log('BUILDING PRESENT')
          return;
        }
      }

      possiblities.push(cLoc);
    });

    if (possiblities.length > 0 || (i > boardSize.height && i > boardSize.width)) {
      if (possiblities.length > 0) {
        M.log('possiblies: ' + possiblities.length);
        locationId = exports.XYToLocationId(possiblities[randomUtils.getRandomInt(1, possiblities.length) - 1]);
      }

      found = true;
    }
    i++;
  } while (!found);

  return locationId;
};

exports.searchForMarriedPieceAtLocationId = function (M, locationId, sex) {
  var marriedPieces = M.getPieces({
    spaceId: locationId,
    class: 'Farmer',
    attrs: {
      married: 'married',
      sex: sex
    }
  });

  return marriedPieces[0];
};

exports.findUnmarriedManPiece = function (M, MARRIAGE_AGE) {
  var unmarriedMen = M.getPieces({
    class: 'Farmer',
    attrs: {
      married: 'single',
      sex: 'male'
    }
  });

  unmarriedMen = _.filter(unmarriedMen, function (possibleBachelor) {
    if (possibleBachelor.attributes.age >= MARRIAGE_AGE) {
      return true;
    }
  });

  return randomUtils.getRandomValue(unmarriedMen);
};
