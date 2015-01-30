
define(['Loader'], function (Loader) {
  var TERRAIN_SIZE = 25,
    scale = .3125; // 25x50 -> 80x160

  var terrainImages = {
    grass: 'assets/environments/grass1.png',
    grass2: 'assets/environments/grass2.png',
    grass3: 'assets/environments/grass3.png',
    water: 'assets/environments/riverLR.png'
  };

  var buildingImages = {
    Castle: 'assets/buildings/factoryBlue.png',
    House1: 'assets/houses/houseBlue.png',
    House2: 'assets/houses/houseGreen.png',
    House3: 'assets/houses/houseRed.png'
  };

  var Map = function (params) {
    var that = new createjs.Container(),
      map;

    var screenOffset = {x: 0, y: 0};
    var placedCastle = params.gameBoard.playerVariables['p1'].placedCastle;

    var mainClickCallback = params.mainClickCallback;

    function init () {
      var simpleMap = getSimpleMapFromGameBoard(params.size, params.gameBoard.spaces);

      that.loadTerrainMap(simpleMap);

      _.each(params.gameBoard.pieces, function (value) {
        if (value.class === '_phantom') return;
        var loc = value.locationId.split(',');
        that.drawBuilding(value.class, {x: loc[0], y: loc[1]}, value.attributes || {});
      });

      that.on('click', function (evt) {
        that.clickedSpace(Math.floor(evt.stageX / TERRAIN_SIZE), Math.floor(evt.stageY / TERRAIN_SIZE));
      });
    }

    that.loadTerrainMap = function (_map) {
      //map =
      _.each(_map, function (yValue, y) {
        _.each(yValue, function (xValue, x) {

          if (xValue === 'grass') {
            var r = Math.floor((Math.random() * 3) + 1);
            xValue = {
              1: 'grass',
              2: 'grass2',
              3: 'grass3'
            }[r];
          }

          var terrainImage = terrainImages[xValue]
            newBitmap = new createjs.Bitmap(terrainImage);
          newBitmap.x = x * TERRAIN_SIZE;
          newBitmap.y = y * TERRAIN_SIZE - TERRAIN_SIZE;
          newBitmap.scaleX = newBitmap.scaleY = scale;
          that.addChild(newBitmap);
        });
      });
    };

    var getHouseType = function (f) {
      if (!f) return 'House1';

      var colors = ['House1', 'House2', 'House3'];

      return colors[(f.charCodeAt(0) + f.charCodeAt(1) + f.charCodeAt(2)) % 3];
    };

    that.drawBuilding = function (type, loc, attributes) {
      var yOffset;
      if (type === 'House') {
        yOffset = TERRAIN_SIZE;
        type = getHouseType(attributes.familyName || attributes.family);
      }
      if (type === 'Castle') {
        yOffset = TERRAIN_SIZE * 2;
        placedCastle = true;
      }
      var newBitmap = new createjs.Bitmap(buildingImages[type]);
      newBitmap.x = loc.x * TERRAIN_SIZE;
      newBitmap.y = loc.y * TERRAIN_SIZE - yOffset;
      newBitmap.scaleX = newBitmap.scaleY = scale;
      that.addChild(newBitmap);
    };

    that.clickedSpace = function (x, y) {
      console.log('clicked ' + x + ', ' + y);

      if (!placedCastle) {
        console.log('place castle!')
        params.func(x,y);
      }
      mainClickCallback(x,y);
    };


    init();
    return that;
  };

  var getSimpleMapFromGameBoard = function (size, spaces) {

    var map = [], y;
    for (y=0;y<size.height;y++) {
      map.push([]);
    }

    _.each(spaces, function (value) {
      var loc = value.boardSpaceId.split(',');
      map[loc[1]][loc[0]] = value.attributes.terrainType;
    });

    return map;
  };

  return Map;
});