
module.exports = {
  boardGenerator: require('./code/boardGenerator'),
  gameStart: require('./code/gameStart'),

  actions: {
    'PlaceCastle': require('./actions/PlaceCastle')
  },

  progressTurn: undefined, // doesnt exist because this is playByMail
  progressRound: require('./code/progressRound'),
  winCondition: require('./code/winCondition')
};