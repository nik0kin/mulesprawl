var _ = require('lodash'),
  Q = require('q');

var actionsUtils = require('mule-utils/actionsUtils'),
  mapUtils = require('./mapUtils'),
  addNewHouse = require('./pieces/NewHouse'),
  addNewFarmer = require('./pieces/NewFarmer');

var HARVEST_TIME = 5,
  HARVEST_GOLD_AMT = 1,
  MARRIAGE_AGE_MALE = 16,
  MARRIAGE_AGE_FEMALE = 14,
  CHILD_DEATH_CHANCE = .001,
  CHILD_DEATH_RANGE = [0,5],
  DEATH_CHANCE = .0005,
  OLD_AGE_MIN = 55,
  OLD_AGE_DEATH_CHANCE_PER_AGE = .00015,// 60year old = ~.01 = 60 * x
  PREGNANCY_CHANCE = .01,
  FERTILE_RANGE = [15,30],
  FERTILE_BONUS_CHANCE = .065,
  PREGNANCY_LENGTH = 9,
  SAFE_BIRTH_CHANCE = .8;

var DEBUG_PLAGUE_CHANCE = 0;

var progressRoundHook = function (M) {
  var promiseArray = [],
    currentRound = M.getCurrentRoundNumber(),
    farmers = M.getPieces({class: 'Farmer'});
    _metadata = {
      newFarms: [],
      removedFarms: [],
      marriages: [],
      becomeMan: [],
      pregnancies: [],
      miscarriage: [],
      births: [],
      birthdays: [],
      deaths: []
    },
    deathPieceIds = [];

  var goldMade = 0;
  _.each(farmers, function (farmer) {
    //// birthdays! ////
    if (!farmer.attributes.birthMonth) {
      farmer.attributes.birthMonth = currentRound % 12 + 1;
    } else if (farmer.attributes.birthMonth === (currentRound % 12 + 1)) {
      farmer.attributes.age++;
      _metadata.birthdays.push({
        name: farmer.attributes.name + ' ' + farmer.attributes.familyName,
        age: farmer.attributes.age
      });

      if (farmer.attributes.sex === 'male' && farmer.attributes.age === MARRIAGE_AGE_MALE
        && farmer.attributes.married === 'single') {
        M.log('male coming of age!');
        //create farm
        var spaceId = mapUtils.findNearestAvailableFarmSpace(M, farmer.locationId);
        if (spaceId) {
          // new farm
          var location = mapUtils.locationIdToXY(spaceId),
            p = {
              playerRel: farmer.ownerId,
              where: location,
              familyName: farmer.attributes.familyName
            };
          _metadata.newFarms.push(spaceId);
          _metadata.becomeMan.push({
            name: farmer.attributes.name + ' ' + farmer.attributes.familyName,
            where: spaceId
          });
          addNewHouse(M, p);

          // move farmer out
          farmer.locationId = spaceId;
          farmer.attributes.homeId = spaceId;
          M.log(farmer.attributes.name + ' ' + farmer.attributes.familyName + ' moved out to a new Farm: ' + spaceId);
        } else {
          M.log('NO MORE ROOM?!!?');
        }
      }
    }

    //// harvest (every 5 rounds give playerVars.gold +1) ////
    if (!farmer.attributes.harvest) {
      //start harvest
      farmer.attributes.harvest = currentRound + HARVEST_TIME;
      if (farmer.age < 10)
        farmer.attributes.harvest += HARVEST_TIME;
    } else if (farmer.attributes.harvest <= currentRound) {
      goldMade += HARVEST_GOLD_AMT;

      farmer.attributes.harvest = currentRound + HARVEST_TIME;
      if (farmer.age < 10)
        farmer.attributes.harvest += HARVEST_TIME;
    }

    //// marriage ////
    if (farmer.attributes.sex === 'female' && farmer.attributes.age >= MARRIAGE_AGE_FEMALE
      && farmer.attributes.married === 'single') {
      M.log(farmer.attributes.name + ' trying to get married');
      //try to get married
      var manPiece = mapUtils.findUnmarriedManPiece(M, MARRIAGE_AGE_MALE);
      if (manPiece) {
        // move farmer out and set marriages
        M.log(farmer.attributes.name + ' ' + farmer.attributes.familyName + ' married '
          + manPiece.attributes.name + ' ' + manPiece.attributes.familyName);
        _metadata.marriages.push({
          wife: farmer.attributes.name + ' ' + farmer.attributes.familyName,
          husband: manPiece.attributes.name + ' ' + manPiece.attributes.familyName
        });
        farmer.attributes.familyName = manPiece.attributes.familyName;
        farmer.attributes.married = 'married';
        farmer.locationId = manPiece.locationId;
        farmer.attributes.home = manPiece.attributes.home;
        manPiece.attributes.married = 'married';
        M.setPiece(manPiece.id, manPiece);
        M.log(farmer.attributes.name + ' ' + farmer.attributes.familyName + ' moved out to a new Farm');
      }
    }

    //// pregnancy ////
    if (farmer.attributes.married === 'married' && farmer.attributes.sex === 'female'
      && (!farmer.attributes.pregnant || farmer.attributes.pregnant < currentRound)) {
      //roll for pregnancy
      var pregnancyChance = PREGNANCY_CHANCE;
      if (farmer.attributes.age >= FERTILE_RANGE[0] && farmer.attributes.age <= FERTILE_RANGE[1])
        pregnancyChance += FERTILE_BONUS_CHANCE;

      if (pregnancyChance >= Math.random()) {
        M.log('farmer ' + farmer.attributes.name + ' ' + farmer.attributes.familyName + ' is going to have a baby');
        farmer.attributes.pregnant = currentRound + PREGNANCY_LENGTH;
        _metadata.pregnancies.push(farmer.attributes.name + ' ' + farmer.attributes.familyName);
      }
    } else if (farmer.attributes.pregnant === currentRound) {
      //roll for birth
      if (SAFE_BIRTH_CHANCE >= Math.random()) {
        //new child!
        var loc = farmer.locationId.split(',');
        loc = {x: loc[0], y: loc[1]};
        var p = {
          playerRel: farmer.ownerId,
          where: loc,
          sex: Math.random() > .5 ? 'male' : 'female',
          age: 0,
          married: 'single',
          familyName: farmer.attributes.familyName,
          homeId: farmer.attributes.home
        };
        M.log('new baby!!');
        addNewFarmer(M, p);
        _metadata.births.push(farmer.attributes.familyName);
      } else {
        M.log('dead baby');
        _metadata.miscarriage.push(farmer.attributes.name + ' ' + farmer.attributes.familyName);
      }
    }

    //// death ////
    var deathChance = DEATH_CHANCE + DEBUG_PLAGUE_CHANCE;

    if (farmer.attributes.age <= CHILD_DEATH_RANGE[1]) {
      deathChance += CHILD_DEATH_CHANCE;
    } else if (farmer.attributes.age >= OLD_AGE_MIN) {
      deathChance += farmer.attributes.age * OLD_AGE_DEATH_CHANCE_PER_AGE;
    }

      //roll for death
    if (deathChance >= Math.random()) {
      _metadata.deaths.push({
        name: farmer.attributes.name + ' ' + farmer.attributes.familyName,
        age: farmer.attributes.age, id: farmer._id
      });
      deathPieceIds.push(farmer.id);
      M.log(farmer.attributes.name + ' ' + farmer.attributes.familyName + ' died at ' + farmer.attributes.age);

      farmer.attributes.dead = true;
      M.setPiece(farmer.id, farmer); // need to set early, to delete farm

      //change partners status
      if (farmer.attributes.married === 'married' && farmer.attributes.sex === 'male') {
        //find wife
        var wife = mapUtils.searchForMarriedPieceAtLocationId(M, farmer.locationId, 'female');
        if (wife) {
          M.log('WIFE widowed (my husband died)');
          wife.attributes.married = 'widowed';
          M.setPiece(wife.id, wife);
        }
      } else if (farmer.attributes.married === 'married' && farmer.attributes.sex === 'female') {
        //find husband
        var husband = mapUtils.searchForMarriedPieceAtLocationId(M, farmer.locationId, 'male');
        if (husband) {
          M.log('HUSBAND widowed (my wife died)');
          husband.attributes.married = 'single';
          M.setPiece(husband.id, husband);
        }
      }

      // check if farm needs to be deleted
      var farmersAtDeadmansLand = M.getPieces({spaceId: farmer.locationId, className: 'Farmer'});
      var deadmansLandHouse = M.getPieces({spaceId: farmer.locationId, className: 'House'})[0];

      var allDead = true;
      _.each(farmersAtDeadmansLand, function (f) {
        if (!f.attributes.dead) {
          allDead = false;
        }
      });

      if (allDead) {
        deathPieceIds.push(deadmansLandHouse.id);
        M.log('removing deadmans farm: ' + deadmansLandHouse.id);
        _metadata.removedFarms.push(farmer.locationId);
      }
    }

    //// save piece ////
    M.setPiece(farmer.id, farmer);
  });

  //update the gold
  M.log(goldMade + 'gold made!');
  M.addToPlayerVariable('p1', 'gold', goldMade);

  //delete the deaths
  M.deletePieces(deathPieceIds);

  return M.persistQ()
    .then(function () {
      //add meta data
      return Q(_metadata);
    });
};

module.exports = progressRoundHook;
